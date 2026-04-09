// Authentication middleware
// Verifies the JWT token sent by the client in Authorization header
// If valid, attaches the user info to req.user and calls next()
// If invalid, returns 401 Unauthorized
import jwt from 'jsonwebtoken';

export const authenticate = (req, res, next) => {
  try {
    // Expected header format: "Authorization: Bearer <token>"
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    // Verify the token signature using our secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info for the next handlers (controllers)
    req.user = { id: decoded.userId, email: decoded.email };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};
