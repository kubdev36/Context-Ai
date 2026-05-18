import {
  summarizeContent,
  translateContent,
  explainContent,
  askAboutContent,
} from "../services/ai.service.js";

const normalizeTargetLanguage = (targetLanguage) => {
  if (!targetLanguage || !String(targetLanguage).trim()) {
    return "Vietnamese";
  }

  const normalized = String(targetLanguage).trim().toLowerCase();

  if (["vi", "vi-vn", "vietnamese", "tieng viet", "tiếng việt"].includes(normalized)) {
    return "Vietnamese";
  }

  if (["en", "en-us", "english"].includes(normalized)) {
    return "English";
  }

  return String(targetLanguage).trim();
};

export const summarizePage = async (req, res) => {
  try {
    const { title, url, content } = req.body;

    if (!content || content.trim().length < 20) {
      return res.status(400).json({
        success: false,
        message: "Content is too short to summarize",
      });
    }

    const summary = await summarizeContent({ title, url, content });

    res.json({
      success: true,
      data: {
        title,
        url,
        summary,
      },
    });
  } catch (error) {
    console.error("Summarize error:", error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to summarize page",
      details: error.details || undefined,
    });
  }
};

export const translatePage = async (req, res) => {
  try {
    const { content, targetLanguage } = req.body;
    const normalizedTargetLanguage = normalizeTargetLanguage(targetLanguage);

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Content is required",
      });
    }

    const translation = await translateContent({
      content,
      targetLanguage: normalizedTargetLanguage,
    });

    res.json({
      success: true,
      data: {
        translation,
        targetLanguageUsed: normalizedTargetLanguage,
      },
    });
  } catch (error) {
    console.error("Translate error:", error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to translate content",
      details: error.details || undefined,
    });
  }
};

export const explainPage = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Content is required",
      });
    }

    const explanation = await explainContent({ content });

    res.json({
      success: true,
      data: {
        explanation,
      },
    });
  } catch (error) {
    console.error("Explain error:", error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to explain content",
      details: error.details || undefined,
    });
  }
};

export const askPage = async (req, res) => {
  try {
    const { title, url, content, question } = req.body;

    if (!content || !question) {
      return res.status(400).json({
        success: false,
        message: "Content and question are required",
      });
    }

    const answer = await askAboutContent({
      title,
      url,
      content,
      question,
    });

    res.json({
      success: true,
      data: {
        answer,
      },
    });
  } catch (error) {
    console.error("Ask error:", error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to answer question",
      details: error.details || undefined,
    });
  }
};
