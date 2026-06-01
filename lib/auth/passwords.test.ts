import { describe, expect, it } from "vitest";
import {
  defaultStudentInitialPassword,
  generateInitialPassword,
  hashPassword,
  verifyPassword,
} from "./passwords";

describe("password helpers", () => {
  it("verifies a hashed password", async () => {
    const hash = await hashPassword("Password123!");

    await expect(verifyPassword("Password123!", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("generates readable initial passwords", () => {
    const password = generateInitialPassword();

    expect(password).toMatch(/^SW[0-9]{6}$/);
  });

  it("uses a shared initial password for imported students", () => {
    expect(defaultStudentInitialPassword).toBe("Password123!");
  });
});
