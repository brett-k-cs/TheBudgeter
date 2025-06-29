import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

import { handleRequest } from 'src/utils/handle-request';

import { Iconify } from 'src/components/iconify';
// ----------------------------------------------------------------------

export function SignUpView() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignUp = async () => {
    // Validate input
    if (!name || name.trim() === '' || name.length < 3) {
      setError('Please enter a valid name (at least 3 characters).');
      return;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setError('');

    // Request to sign up
    const result = await handleRequest(
      '/api/auth/register',
      'POST',
      setError,
      false, // No authentication needed for sign up
      {
        name,
        email,
        password,
      }
    );

    if (result?.success) {
      navigate('/');
    }
  };

  const renderForm = (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-end',
        flexDirection: 'column',
      }}
    >
      <TextField
        fullWidth
        name="name"
        label="Full Name"
        placeholder="Bob Smith"
        value={name}
        onChange={(e) => setName(e.target.value)}
        sx={{ mb: 3 }}
        slotProps={{
          inputLabel: { shrink: true },
        }}
        error={error === 'Please enter a valid name (at least 3 characters).'}
      />

      <TextField
        fullWidth
        name="email"
        label="Email address"
        placeholder="hello@gmail.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        sx={{ mb: 3 }}
        slotProps={{
          inputLabel: { shrink: true },
        }}
        error={error === 'Please enter a valid email.'}
      />

      <Link variant="body2" color="inherit" sx={{ mb: 1.5 }}>
        Forgot password?
      </Link>

      <TextField
        fullWidth
        name="password"
        label="Password"
        placeholder="@demo1234"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type={showPassword ? 'text' : 'password'}
        slotProps={{
          inputLabel: { shrink: true },
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                  <Iconify icon={showPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
        sx={{ mb: 3 }}
        error={error === 'Please enter your password.'}
      />

      <Button
        fullWidth
        size="large"
        type="submit"
        color="inherit"
        variant="contained"
        onClick={handleSignUp}
      >
        Sign up
      </Button>
    </Box>
  );

  return (
    <>
      <Box
        sx={{
          gap: 1.5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mb: 5,
        }}
      >
        <Typography variant="h5">Sign up</Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            textAlign: 'center',
          }}
        >
          Already have an account?
          <Link variant="subtitle2" sx={{ ml: 0.5 }} onClick={() => navigate('/sign-in')}>
            Sign in
          </Link>
          {error && (
            <Typography variant="body2" color="error" sx={{ textAlign: 'center', mt: 1 }}>
              {error}
            </Typography>
          )}
        </Typography>
      </Box>
      {renderForm}
      {/* <Divider sx={{ my: 3, '&::before, &::after': { borderTopStyle: 'dashed' } }}>
        <Typography
          variant="overline"
          sx={{ color: 'text.secondary', fontWeight: 'fontWeightMedium' }}
        >
          OR
        </Typography>
      </Divider>
      <Box
        sx={{
          gap: 1,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <IconButton color="inherit">
          <Iconify width={22} icon="socials:google" />
        </IconButton>
        <IconButton color="inherit">
          <Iconify width={22} icon="socials:github" />
        </IconButton>
        <IconButton color="inherit">
          <Iconify width={22} icon="socials:twitter" />
        </IconButton>
      </Box> */}
    </>
  );
}
