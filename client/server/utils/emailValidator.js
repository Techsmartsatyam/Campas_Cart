/**
 * Utility for strict email syntax validation and normalization
 */

// RFC-compliant email regex ensuring valid domain extension (at least 2 letters after dot)
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Validates email syntax strictly
 * Rejects: test, abc, abc@, @test.com, user@@gmail.com, user@., abc.com
 * Accepts: student@gmail.com, student@outlook.com, student@yahoo.com
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length < 5 || trimmed.length > 254) return false;
  
  // Check for consecutive @ symbols or double dots
  if (trimmed.includes('@@') || trimmed.includes('..')) return false;

  return EMAIL_REGEX.test(trimmed);
};

/**
 * Normalizes email address (trim whitespace + lowercase)
 */
export const normalizeEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
};
