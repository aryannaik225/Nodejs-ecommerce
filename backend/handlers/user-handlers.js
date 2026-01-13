import { createUser, findUserByEmail } from "../db/user-queries.js";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "mysecretkey123";

export const signup = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required." })
  }

  try {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email." })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    await createUser(name, email, hashedPassword)

    return res.status(201).json({ message: "User created successfully." })
  } catch (error) {
    console.log("Error during signup: ", error)
    return res.status(500).json({ message: "Error signing up." })
  }
}

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await findUserByEmail(email)
    if (!user) {
      return res.status(400).json({ message: "User not found." })
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password)
    if (!isPasswordCorrect) {
      return res.status(403).json({ message: "Invalid credentials." })
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' })

    return res.status(200).json({ message: "Login successful", token, user: { name: user.name, email: user.email } })
  } catch (error) {
    console.log("Error during login: ", error)
    return res.status(500).json({ message: "Error logging in." })
  }
}