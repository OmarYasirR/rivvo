export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export const isValidUsername = (username) => /^[a-zA-Z0-9_.]{3,20}$/.test(username);
export const isStrongPassword = (password) => password.length >= 8;
