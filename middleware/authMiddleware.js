// Middleware to verify if the user is logged in via their Passport Session
const authenticateUser = (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }
    return res.status(401).json({ error: "Access Denied: Please log in first." });
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