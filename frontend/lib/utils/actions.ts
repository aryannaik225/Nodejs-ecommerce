"use server";

import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "fallback_secret_dont_use_in_production";

export async function loginAdminAction(password: string) {
  const CORRECT_PASSWORD = process.env.ADMIN_PASSWORD;

  if (password !== CORRECT_PASSWORD) {
    return { success: false, token: null };
  }

  const token = jwt.sign({ role: "admin" }, SECRET_KEY, {
    expiresIn: "24h",
  });

  return { success: true, token };
}

export async function verifyAdminTokenAction(token: string) {
  try {
    jwt.verify(token, SECRET_KEY);
    return { isValid: true };
  } catch (error) {
    return { isValid: false };
  }
}