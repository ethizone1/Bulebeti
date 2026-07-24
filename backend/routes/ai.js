const express = require("express");
const router = express.Router();
const { GoogleGenAI } = require("@google/genai");

// In a real production app, ensure your GEMINI_API_KEY is in your .env file
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

router.post("/chat", async (req, res) => {
  try {
    const { message, role, restaurantName } = req.body;
    const nameStr = restaurantName || "the restaurant";

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (ai) {
      // Use Live Google Gemini AI
      const systemInstruction =
        role === "admin"
          ? `You are the Admin AI Assistant for ${nameStr}. Your job is to help the restaurant owner manage their business, answer questions about analytics, marketing, and operations. Be concise, professional, and helpful. Always refer to the restaurant as ${nameStr} (not bulebeti).`
          : `You are the AI assistant for ${nameStr}. Your job is to answer customer questions about the menu, reservations, hours, and dietary options in a friendly and appetizing way. Always refer to the restaurant as ${nameStr} (not bulebeti).`;

      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: message,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.7,
          },
        });

        return res.json({ reply: response.text });
      } catch (geminiError) {
        console.error("Gemini API Error:", geminiError);
        // Fallback to mock if API call fails
      }
    }

    // Mock AI fallback if no key or API failed
    const query = message.toLowerCase();
    let reply = "";
    await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate delay

    if (role === "admin") {
      if (query.includes("sales") || query.includes("revenue")) {
        reply =
          "[Mock Mode] Based on your recent data, sales are up 15% this week compared to last week. Your top-selling item is the 'Spicy Garlic Burger'.";
      } else if (query.includes("reservation") || query.includes("booking")) {
        reply =
          "[Mock Mode] You have 12 upcoming reservations for today. Peak time is around 7:00 PM.";
      } else if (query.includes("menu") || query.includes("description")) {
        reply =
          "[Mock Mode] Here's a catchy description: 'Experience a burst of flavor with our signature dish, crafted with locally sourced ingredients and a touch of culinary magic.'";
      } else {
        reply =
          "[Mock Mode] I'm your bulebeti AI assistant. You can ask me about your sales, reservations, or help with writing menu descriptions! (Add a GEMINI_API_KEY to your .env to use the real AI).";
      }
    } else {
      if (query.includes("vegan") || query.includes("vegetarian")) {
        reply =
          "[Mock Mode] Yes! We have several delicious vegan and vegetarian options available on our menu. Be sure to check out our 'Plant-Based' section.";
      } else if (
        query.includes("hour") ||
        query.includes("open") ||
        query.includes("close")
      ) {
        reply =
          "[Mock Mode] We are typically open from 11:00 AM to 10:00 PM on weekdays, and until 11:00 PM on weekends.";
      } else if (query.includes("reservation") || query.includes("book")) {
        reply =
          "[Mock Mode] You can easily book a table by navigating to our 'Reservations' page from the top menu.";
      } else {
        reply =
          "[Mock Mode] Hello! I'm the restaurant's AI assistant. I can help you with questions about our menu, hours, or reservations. (Add a GEMINI_API_KEY to your .env to use the real AI).";
      }
    }

    res.json({ reply });
  } catch (error) {
    console.error("AI Chat Error:", error);
    res.status(500).json({ error: "Failed to process AI request" });
  }
});

module.exports = router;
