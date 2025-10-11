import express from "express";
import axios from "axios";

const ChatbotRoute = express.Router();

const RASA_SERVER_URL = "http://localhost:5005";

// Endpoint để gửi message tới RASA
ChatbotRoute.post("/message", async (req, res) => {
  try {
    const { message, sender, metadata } = req.body;

    if (!message || !sender) {
      return res.status(400).json({ error: "Message and sender are required" });
    }

    // Gửi message tới RASA server
    const response = await axios.post(`${RASA_SERVER_URL}/webhooks/rest/webhook`, {
      sender: sender,
      message: message,
      metadata: metadata || {}
    });

    // Trả về response từ RASA
    res.json({
      success: true,
      responses: response.data
    });

  } catch (error) {
    console.error("Error communicating with RASA:", error);
    res.status(500).json({
      success: false,
      error: "Failed to communicate with chatbot",
      details: error.message
    });
  }
});

// Endpoint để lấy conversation history
ChatbotRoute.get("/history/:sender", async (req, res) => {
  try {
    const { sender } = req.params;

    const response = await axios.get(
      `${RASA_SERVER_URL}/conversations/${sender}/tracker`
    );

    res.json({
      success: true,
      history: response.data
    });

  } catch (error) {
    console.error("Error fetching conversation history:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch conversation history"
    });
  }
});

// Endpoint để reset conversation
ChatbotRoute.post("/reset/:sender", async (req, res) => {
  try {
    const { sender } = req.params;

    await axios.post(
      `${RASA_SERVER_URL}/conversations/${sender}/tracker/events`,
      {
        event: "restart"
      }
    );

    res.json({
      success: true,
      message: "Conversation reset successfully"
    });

  } catch (error) {
    console.error("Error resetting conversation:", error);
    res.status(500).json({
      success: false,
      error: "Failed to reset conversation"
    });
  }
});

// Health check endpoint
ChatbotRoute.get("/health", async (req, res) => {
  try {
    const response = await axios.get(`${RASA_SERVER_URL}/`);
    res.json({
      success: true,
      rasa_status: response.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "RASA server is not available"
    });
  }
});

export default ChatbotRoute;