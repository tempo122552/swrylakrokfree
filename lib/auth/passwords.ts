import bcrypt from "bcryptjs";

export const defaultSharedInitialPassword = "Password123!";
export const defaultStudentInitialPassword = defaultSharedInitialPassword;
export const defaultAdultInitialPassword = defaultSharedInitialPassword;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function generateInitialPassword() {
  const value = Math.floor(100000 + Math.random() * 900000);
  return `SW${value}`;
}
