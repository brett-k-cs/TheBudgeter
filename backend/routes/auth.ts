import { Request, Response, Router } from 'express';

import { passwordStrength, isValidEmail } from '../auth/utils.js';
import { hashPassword, verifyPassword } from '../auth/login.js';
import { signRefreshToken } from '../auth/jwt.js';
import { User } from '../models/user.js';

const router = Router();

type RegisterRequestBody = {
  name: string;
  password: string;
  email: string;
};

router.post('/register', async (req: Request<{}, {}, RegisterRequestBody>, res: Response) => {
  const { name, password, email } = req.body;

  if (passwordStrength(password) < 4) {
    res.status(400).json({ error: 'Password isn\'t strong enough' });
    return;
  }

  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'Invalid email format' });
    return;
  }

  if (!name || name.length < 3) {
    res.status(400).json({ error: 'Name must be at least 3 characters long' });
    return;
  }

  const passwordHash = hashPassword(password);

  // Check if the user already exists
  const user = await User.findOne({ where: { email } });
  if (user) {
    res.status(400).json({ error: 'User already exists with this email' });
    return;
  }

  // Create a new user
  const newUser = await User.create({
    name,
    passwordHash,
    email,
  });
  if (!newUser) {
    res.status(500).json({ error: 'Failed to create user' });
    return;
  }

  // Generate a JWT refresh token
  const payload = {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
  }

  const refreshToken = signRefreshToken(payload);
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    sameSite: 'strict',
  });

  res.status(201).json({ success: true, message: 'User registered successfully' });
});

type LoginRequestBody = {
  email: string;
  password: string;
};

router.post('/login', async (req: Request<{}, {}, LoginRequestBody>, res: Response) => {
  const { email, password } = req.body;
  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'Invalid email format' });
    return;
  }

  // Check if the user exists
  const user = await User.findOne({ where: { email } });
  const passwordHash = user?.passwordHash;
  if (!user || !passwordHash) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  // Verify the password
  const isPasswordValid = verifyPassword(password, passwordHash);
  if (!isPasswordValid) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  // Generate a JWT refresh token
  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
  };
  const refreshToken = signRefreshToken(payload);
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    sameSite: 'strict',
  });

  res.status(200).json({ success: true, message: 'Login successful' });
});

router.post('/logout', (req: Request, res: Response) => {
  // Clear the refresh token cookie
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

export const authRouter = router;