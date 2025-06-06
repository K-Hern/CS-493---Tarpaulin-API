const jwt = require('jsonwebtoken');
const User = require('../models/user');

// NOTE - users endpoints expect auth middleware to set req.user to their role

const JWT_SECRET = process.env.JWT_SECRET;

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!JWT_SECRET) {
    console.error("FATAL: JWT_SECRET is not defined for authentication.");
    return res.status(501).json({ error: "Server authentication not configured." }); 
  }

  if (authHeader) {
    const token = authHeader.split(' ')[1];
    console.log("Token received:", token);

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; 
        next();
      } catch (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ error: 'Token expired.' });
        }
        if (err.name === 'JsonWebTokenError') {
          return res.status(401).json({ error: 'Invalid token.' });
        }

        console.error("JWT verification error:", err);
        return res.status(401).json({ error: 'Could not authenticate token.' });
      }
    } else {
      // res.status(401).json({ error: 'Authentication token missing.' });
     return res.status(401).json({ error: 'Authentication token missing.' });
    }
  } else {
    // res.status(401).json({ error: 'Authentication required.' });
    return res.status(401).json({ error: 'Authentication required.' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user && req.user.admin) {
    next();
  } else {
    res.status(403).json({ error: 'Admin privileges required.' });
  }
}

module.exports = { requireAuth, requireAdmin }; 