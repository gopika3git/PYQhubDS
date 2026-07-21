const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini with GEMINI_API_KEY from your .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Active production models (deprecated 1.5/2.0 series removed)
const MODELS = [
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite"
];

exports.askTutor = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || typeof question !== "string" || !question.trim()) {
      return res.status(400).json({ error: "Question cannot be empty." });
    }

    let reply = null;
    let lastError = null;

    // Try active models in order
    for (const modelName of MODELS) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction:
            "You are a helpful academic tutor for university students reviewing past year question papers (PYQs). Provide clear, step-by-step, concise explanations for the user's questions.",
        });

        const result = await model.generateContent(question.trim());
        const response = await result.response;
        reply = response.text();

        if (reply) break; // Successfully received response
      } catch (err) {
        console.warn(`⚠️ Model ${modelName} warning:`, err.message || err);
        lastError = err;
      }
    }

    if (!reply) {
      throw lastError || new Error("AI services were unavailable.");
    }

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("🔴 Gemini AI Chat Error:", error);
    return res.status(500).json({
      error: "Failed to fetch response from AI tutor. Please try again shortly.",
    });
  }
};