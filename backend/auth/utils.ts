export const passwordStrength = (password: string): number => {
  let score = 0;

  if (!password) return score;

  // Length
  if (password.length >= 8) score += 1;

  // Lowercase
  if (/[a-z]/.test(password)) score += 1;

  // Uppercase
  if (/[A-Z]/.test(password)) score += 1;

  // Numbers
  if (/\d/.test(password)) score += 1;

  // Special characters
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  return score;
}

export const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};