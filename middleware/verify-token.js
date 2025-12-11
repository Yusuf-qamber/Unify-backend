const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization || "";
    if (authHeader.startsWith("Bearer ")) token = authHeader.split(" ")[1];
    if (!token && req.cookies) token = req.cookies.token;

    if (!token) return res.status(401).json({ err: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ err: 'Invalid token.' });
  }
};

module.exports = verifyToken;
