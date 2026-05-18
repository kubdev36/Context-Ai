import express from "express";
import {
  summarizePage,
  translatePage,
  explainPage,
  askPage,
} from "../controllers/ai.controller.js";

const router = express.Router();

router.post("/summarize", summarizePage);
router.post("/translate", translatePage);
router.post("/explain", explainPage);
router.post("/ask", askPage);

export default router;