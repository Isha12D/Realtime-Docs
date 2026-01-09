// middleware/authMiddleware.js
import jwt from "jsonwebtoken";

export default (req, res, next) => {
  const token = req.headers.authorization;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.userId = decoded.id;
  next();
};
