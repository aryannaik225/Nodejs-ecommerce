import { createUser, findUserByEmail } from "../TiDB/user-queries.js";
import prisma from "../config/prisma.js";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "mysecretkey123";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "myrefreshsecretkey123";

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '60m' });
  const refreshToken = jwt.sign({ id: userId }, REFRESH_SECRET, { expiresIn: '30d' });
  return { accessToken, refreshToken };
}

const setRefreshTokenCookie = (res, token, rememberMe) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax',
    path: '/',
  }

  if (rememberMe) {
    cookieOptions.maxAge = 10 * 24 * 60 * 60 * 1000;
  }

  res.cookie('refreshToken', token, cookieOptions)
}

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
  const { email, password, rememberMe } = req.body;

  try {
    const user = await findUserByEmail(email)
    if (!user) {
      return res.status(400).json({ message: "User not found." })
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password)
    if (!isPasswordCorrect) {
      return res.status(403).json({ message: "Invalid credentials." })
    }

    const { accessToken, refreshToken } = generateTokens(user.id)

    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id }
    })

    setRefreshTokenCookie(res, refreshToken, rememberMe);

    return res.status(200).json({
      message: "Login successful.",
      token: accessToken,
      user: { id: user.id, name: user.name, email: user.email }
    })
  } catch (error) {
    console.log("Error during login: ", error)
    return res.status(500).json({ message: "Error logging in." })
  }
}

export const refresh = async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken;

  if (!incomingRefreshToken) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(incomingRefreshToken, REFRESH_SECRET);

    const existingToken = await prisma.refreshToken.findUnique({
      where: { token: incomingRefreshToken }
    });

    if (!existingToken) {
      return res.status(403).json({ message: "Invalid Refresh Token" });
    }

    await prisma.refreshToken.delete({ where: { id: existingToken.id } });

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.id);

    await prisma.refreshToken.create({
      data: { token: newRefreshToken, userId: decoded.id }
    });

    setRefreshTokenCookie(res, newRefreshToken, true); 

    return res.json({ token: accessToken });

  } catch (error) {
    return res.status(403).json({ message: "Invalid Refresh Token" });
  }
};

export const logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken }
    }).catch(() => {});
  }

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
  })

  return res.status(200).json({ message: "Logged out successfully." });
}
