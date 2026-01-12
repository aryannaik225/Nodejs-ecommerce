import { pool } from "./index.js";
import prisma from "./prisma.js";

export const findUserByEmail = async (email) => {
  try {
    const user = await prisma.users.findUnique({
      where: { email: email },
    });
    return user;
  } catch (error) {
    console.log("Error finding user", error);
    throw error;
  }
};

export const createUser = async (name, email, password) => {
  try {
    const newUser = await prisma.users.create({
      data: {
        name: name,
        email: email,
        password: password,
      },
    });
    return newUser;
  } catch (error) {
    console.log("Error creating user", error)
    throw error;
  }
}