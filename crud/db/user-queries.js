import { pool } from "./index.js";

export const findUserByEmail = async (email) => {
  // const QUERY = "SELECT * FROM users WHERE email = ?";
  try {
    // const [rows] = await pool.query(QUERY, [email]);
    // return rows[0];

    const user = await prisma.user.findUnique({
      where: { email: email },
    });
    return user;
  } catch (error) {
    console.log("Error finding user", error);
    throw error;
  }
};

export const createUser = async (name, email, password) => {
  // const QUERY = "INSERT INTO users (name, email, password) VALUES (? , ?, ?)"
  try {
    // const [result] = await pool.query(QUERY, [name, email, password])
    // return result;

    const newUser = await prisma.user.create({
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