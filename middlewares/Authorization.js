const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const token = req.header("Authorization").split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Invalid token" });
  }
  try {
    const decoded_token = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.username = decoded_token.username;
    next();
  } catch (err) {
    res.status(500).json({ message: "Internal server error", err });
  }
};

module.exports = verifyToken;
