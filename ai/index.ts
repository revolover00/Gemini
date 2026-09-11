import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { experimental_wrapLanguageModel as wrapLanguageModel } from "ai";

import { customMiddleware } from "./custom-middleware";

const apiKey =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
  "";

const google = createGoogleGenerativeAI({
  apiKey,
});

export const geminiProModel = wrapLanguageModel({
  model: google("gemini-2.5-pro"),
  middleware: customMiddleware,
});

export const geminiFlashModel = wrapLanguageModel({
  model: google("gemini-2.5-flash"),
  middleware: customMiddleware,
});
