import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "mysecretkey123";

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Headers usually look like: "Bearer <token>"
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided. " })
  }

  const token = authHeader.split(" ")[1]; // Extract the part after "Bearer "

  if (!token) {
    return res.status(401).json({ message: "Authentication failed." })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token." })
  }
}