// backend/routes/OpenAIChatbotRoutes.js
import express from "express";
import { chat, getHistory, resetConversation } from "../controller/ChatBotAI.js";

const OpenAIChatbotRoute = express.Router();

// Chat endpoint
OpenAIChatbotRoute.post("/chat", chat);

// Reset conversation
OpenAIChatbotRoute.post("/reset", resetConversation);

// Get conversation history
OpenAIChatbotRoute.get("/history/:userId", getHistory);

// Health check
OpenAIChatbotRoute.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "OpenAI Chatbot is running",
    timestamp: new Date().toISOString()
  });
});

export default OpenAIChatbotRoute;