const jwt = require('jsonwebtoken');

// Middleware to verify if the user is logged in via their JWT token
const authenticateUser = (req, res, next) => {
    // Prefer httpOnly cookie token (stronger), fallback to Authorization header if present.
    const cookieToken = req.cookies && req.cookies.token;
    const authHeader = req.headers.authorization;
    const headerToken = authHeader && authHeader.split(' ')[1]; // Splits "Bearer <token>"

    const token = headerToken || cookieToken;

    if (!token) {
        return res.status(401).json({ error: "Access Denied: Please log in first." });
    }


    try {
        // Verify the token using the secret key stored in your .env file
        // (Make sure you have JWT_SECRET defined in your .env file!)
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'your_fallback_jwt_secret');
        req.user = verified; // Attaches user details (id, role) to the request object
        next(); // Pass control to the next function (or controller)
    } catch (err) {
        return res.status(403).json({ error: "Session expired or invalid token. Please log in again." });
    }
};

// Middleware to restrict access based on specific roles ('admin', 'student')
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        // If the logged-in user's role isn't in the allowed array, block them!
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: "Forbidden: You do not have permission to perform this action." });
        }
        next();
    };
};

module.exports = {
    authenticateUser,
    authorizeRoles
};