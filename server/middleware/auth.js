const jwt = require("jsonwebtoken");
const User = require("../models/User");

/* Middleware to verify JWT token */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.token;
  if (!authHeader) {
    return res.status(401).json({ message: "You are not authenticated!" });
  }

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Token is not valid!" });
    }
    req.user = user;
    next();
  });
};

/* Middleware to check for specific roles */
const verifyRole = (roles) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      if (!roles.includes(user.role)) {
        return res.status(403).json({ message: "You do not have access." });
      }

      next();
    } catch (err) {
      return res
        .status(500)
        .json({ message: "Internal Server Error", error: err.message });
    }
  };
};

module.exports = { verifyToken, verifyRole };
