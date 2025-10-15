/**
 * Input Validation and Sanitization Utilities
 */

/**
 * Sanitize string input by removing potentially harmful characters
 */
export const sanitizeString = (input: string): string => {
  if (!input) return "";

  // Remove leading/trailing whitespace
  let sanitized = input.trim();

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, "");

  // Limit length to prevent abuse
  const MAX_LENGTH = 10000;
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH);
  }

  return sanitized;
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const isValidPassword = (
  password: string
): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate name (full name, first name, etc.)
 */
export const isValidName = (name: string): boolean => {
  if (!name || name.trim().length === 0) return false;

  // Name should be 2-50 characters, letters, spaces, hyphens, apostrophes only
  const nameRegex = /^[a-zA-Z\s'-]{2,50}$/;
  return nameRegex.test(name.trim());
};

/**
 * Validate age
 */
export const isValidAge = (
  age: number,
  minAge: number = 18,
  maxAge: number = 120
): boolean => {
  return Number.isInteger(age) && age >= minAge && age <= maxAge;
};

/**
 * Validate bio text
 */
export const isValidBio = (bio: string): boolean => {
  if (!bio || bio.trim().length === 0) return false;

  const trimmedBio = bio.trim();

  // Bio should be at least 10 characters and no more than 500
  return trimmedBio.length >= 10 && trimmedBio.length <= 500;
};

/**
 * Sanitize bio to remove excessive whitespace and normalize line breaks
 */
export const sanitizeBio = (bio: string): string => {
  if (!bio) return "";

  // Remove excessive whitespace and normalize line breaks
  return bio
    .trim()
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .replace(/\n{3,}/g, "\n\n") // Limit consecutive line breaks to 2
    .substring(0, 500); // Enforce max length
};

/**
 * Validate URL format
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate interests array
 */
export const validateInterests = (
  interests: string[]
): {
  isValid: boolean;
  sanitized: string[];
  errors: string[];
} => {
  const errors: string[] = [];
  const sanitized: string[] = [];

  if (!Array.isArray(interests)) {
    return {
      isValid: false,
      sanitized: [],
      errors: ["Interests must be an array"],
    };
  }

  for (const interest of interests) {
    if (typeof interest !== "string") {
      errors.push(`Invalid interest type: ${typeof interest}`);
      continue;
    }

    const trimmed = interest.trim();
    if (trimmed.length > 0 && trimmed.length <= 30) {
      sanitized.push(trimmed);
    } else if (trimmed.length > 30) {
      errors.push(`Interest too long: ${interest}`);
    }
  }

  // Limit number of interests
  const MAX_INTERESTS = 25;
  if (sanitized.length > MAX_INTERESTS) {
    errors.push(`Too many interests. Maximum is ${MAX_INTERESTS}`);
    return {
      isValid: false,
      sanitized: sanitized.slice(0, MAX_INTERESTS),
      errors,
    };
  }

  return {
    isValid: errors.length === 0,
    sanitized,
    errors,
  };
};

/**
 * Validate phone number (basic validation)
 */
export const isValidPhone = (phone: string): boolean => {
  // Remove non-digit characters for validation
  const digitsOnly = phone.replace(/\D/g, "");

  // Should be 10-15 digits
  return digitsOnly.length >= 10 && digitsOnly.length <= 15;
};

/**
 * Sanitize search query
 */
export const sanitizeSearchQuery = (query: string): string => {
  if (!query) return "";

  return query
    .trim()
    .replace(/[<>]/g, "") // Remove angle brackets
    .substring(0, 100); // Limit length
};

/**
 * Validate gender input
 */
export const isValidGender = (gender: string): boolean => {
  const validGenders = ["male", "female", "other"];
  return validGenders.includes(gender.toLowerCase());
};

/**
 * Comprehensive profile validation
 */
export const validateProfile = (profile: {
  full_name: string;
  gender: string;
  age: number;
  bio: string;
  interests: string[];
}): {
  isValid: boolean;
  errors: Record<string, string>;
} => {
  const errors: Record<string, string> = {};

  if (!isValidName(profile.full_name)) {
    errors.full_name =
      "Name must be 2-50 characters and contain only letters, spaces, hyphens, and apostrophes";
  }

  if (!isValidGender(profile.gender)) {
    errors.gender = "Please select a valid gender";
  }

  if (!isValidAge(profile.age)) {
    errors.age = "You must be at least 18 years old";
  }

  if (!isValidBio(profile.bio)) {
    errors.bio = "Bio must be between 10 and 500 characters";
  }

  const interestsValidation = validateInterests(profile.interests);
  if (!interestsValidation.isValid) {
    errors.interests = interestsValidation.errors.join(", ");
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
