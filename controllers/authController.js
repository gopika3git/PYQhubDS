const User = require('../models/user');
const jwt = require('jsonwebtoken');

const ALLOWED_EMAIL_SUFFIXES = ['@vitstudent.ac.in', '@vit.ac.in'];

const DISCLAIMER = "Hol' up... ✋ This portal runs strictly on Chittoor road energy, VITians ONLY!!! Elites are studying here, agle saal phir aanaa! 🤝";

function isAllowedVITEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const normalized = email.trim().toLowerCase();
    return ALLOWED_EMAIL_SUFFIXES.some((suffix) => normalized.endsWith(suffix));
}

// 1. REGISTER A NEW USER
exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!isAllowedVITEmail(email)) {
            return res.status(403).json({ message: DISCLAIMER });
        }

        // Check if the user already exists
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        // Create new user (In a production app, you'd hash the password, 
        // but for this college project, we'll keep it simple to avoid extra library bloat)
        user = new User({ name, email, password, role });
        await user.save();

        res.status(201).json({ message: 'User registered successfully!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 2. LOGIN USER
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Air-tight VIT Extension Email Check
        if (!isAllowedVITEmail(email)) {
            return res.status(403).json({ 
                message: "Hol' up... ✋ This portal runs strictly on Chittoor road energy, VITians ONLY!!! Elites are studying here, agle saal phir aanaa! 🤝"
            });
        }

        // 2. Fast Database Lookup (Ensure 'email' is indexed in your User Model)
        const user = await User.findOne({ email }).select('+password'); 
        
        // 3. Credential Verification (Using plain text matching as per your current setup)
        // Note: If you migrate to bcrypt later, change this to: await bcrypt.compare(password, user.password)
        if (!user || user.password !== password) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // 4. Generate a secure JWT Token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // 5. Instantly send response back to frontend
        return res.json({
            token,
            user: { id: user._id, name: user.name, role: user.role }
        });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
