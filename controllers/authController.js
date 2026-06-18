const User = require('../models/user');
const jwt = require('jsonwebtoken');

const ALLOWED_EMAIL_SUFFIXES = ['@vitstudent.ac.in', '@vit.ac.in'];

const DISCLAIMER = "Hol' up... ✋ This portal runs strictly on Chittoor road energy, VITians ONLY!!! Elites are studying here, agle saal phir aanaa! 🤝";

function isAllowedVITEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const normalized = email.trim().toLowerCase();
    return ALLOWED_EMAIL_SUFFIXES.some((suffix) => normalized.endsWith(suffix));
}

// Email-only login
// This endpoint validates VIT email suffix and checks that the user exists in MongoDB.
// It then returns a JWT (used later if you implement token-protected APIs).
exports.login = async (req, res) => {
    try {
        const { email } = req.body;

        if (!isAllowedVITEmail(email)) {
            return res.status(403).json({ message: DISCLAIMER });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });

        // In this email-only flow, there is no password.
        if (!user) {
            return res.status(400).json({ message: 'Account not found for this email.' });
        }

        // Mark session as authenticated for cookie-based dashboard protection
        req.session.userId = user._id;

        // JWT (optional; kept for compatibility with existing client code)
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        return res.json({
            token,
            user: { id: user._id, email: user.email, displayName: user.displayName }
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

