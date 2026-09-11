import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { LanguageModel, wrapLanguageModel } from "ai";

import { customMiddleware } from "@/ai/custom-middleware";

export type ModelType = "pro" | "flash" | string;

export interface ProviderModelInfo {
  id: string;
  name: string;
  description?: string;
}

export interface AIProvider {
  id: "gemini" | "openrouter" | "github-models" | string;
  name: string;
  displayNameArabic: string;
  isEnabled: boolean;
  requiredKeyName: string;
  keyPlaceholder: string;
  availableModels: ProviderModelInfo[];
  createModel: (apiKey: string, modelType?: ModelType) => LanguageModel;
}


// ---------------------------------------------------------------------------
// 1. Google Gemini Provider (Active / Enabled)
// ---------------------------------------------------------------------------
export function createGeminiProModel(apiKey: string): LanguageModelV1 {
  if (!apiKey || apiKey.trim() === "") {
    throw new Error("NO_API_KEY");
  }
  const google = createGoogleGenerativeAI({
    apiKey: apiKey.trim(),
  });
  return wrapLanguageModel({
    model: google("gemini-2.5-pro"),
    middleware: customMiddleware,
  });
}

export function createGeminiFlashModel(apiKey: string): LanguageModelV1 {
  if (!apiKey || apiKey.trim() === "") {
    throw new Error("NO_API_KEY");
  }
  const google = createGoogleGenerativeAI({
    apiKey: apiKey.trim(),
  });
  return wrapLanguageModel({
    model: google("gemini-2.5-flash"),
    middleware: customMiddleware,
  });
}

// Backward-compatibility fallback (uses environment variable if provided)
const envGeminiKey =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
  "";

export const geminiProModel = envGeminiKey
  ? createGeminiProModel(envGeminiKey)
  : (null as unknown as LanguageModelV1);

export const geminiFlashModel = envGeminiKey
  ? createGeminiFlashModel(envGeminiKey)
  : (null as unknown as LanguageModelV1);

export const geminiProvider: AIProvider = {
  id: "gemini",
  name: "Google Gemini",
  displayNameArabic: "جوجل جيميني (Google Gemini)",
  isEnabled: true,
  requiredKeyName: "Gemini API Key",
  keyPlaceholder: "AIzaSy...",
  availableModels: [
    {
      id: "gemini-2.5-pro",
      name: "Gemini 2.5 Pro",
      description: "Advanced reasoning and complex multimodal understanding",
    },
    {
      id: "gemini-2.5-flash",
      name: "Gemini 2.5 Flash",
      description: "High speed, lightweight and cost-effective generation",
    },
  ],
  createModel: (apiKey: string, modelType: ModelType = "pro"): LanguageModelV1 => {
    if (modelType === "flash" || modelType === "gemini-2.5-flash") {
      return createGeminiFlashModel(apiKey);
    }
    return createGeminiProModel(apiKey);
  },
};

// ---------------------------------------------------------------------------
// 2. OpenRouter Provider (Placeholder - Disabled)
// ---------------------------------------------------------------------------
// TODO: Implement OpenRouter provider when student configures OPENROUTER_API_KEY.
// Intended to provide flexible routing across open and proprietary models via OpenRouter API.
export const openrouterProvider: AIProvider = {
  id: "openrouter",
  name: "OpenRouter",
  displayNameArabic: "أوبن روتر (OpenRouter.ai)",
  isEnabled: false,
  requiredKeyName: "OpenRouter API Key",
  keyPlaceholder: "sk-or-v1-...",
  availableModels: [
    {
      id: "anthropic/claude-3.7-sonnet",
      name: "Claude 3.7 Sonnet (OpenRouter)",
      description: "Hybrid reasoning model via OpenRouter",
    },
    {
      id: "deepseek/deepseek-r1",
      name: "DeepSeek R1 (OpenRouter)",
      description: "Full reasoning open weights via OpenRouter",
    },
    {
      id: "meta-llama/llama-3.3-70b-instruct",
      name: "Llama 3.3 70B (OpenRouter)",
      description: "Open weights model via OpenRouter",
    },
  ],
  createModel: () => {
    throw new Error("المزود ده (OpenRouter) لسه مش مفعّل");
  },
};

// ---------------------------------------------------------------------------
// 3. GitHub Models Provider (Placeholder - Disabled)
// ---------------------------------------------------------------------------
// TODO: Implement GitHub Models provider when student configures GITHUB_TOKEN.
// Intended to connect to GitHub Models endpoint (Azure AI Foundry powered) using standard GitHub personal access token.
export const githubModelsProvider: AIProvider = {
  id: "github-models",
  name: "GitHub Models",
  displayNameArabic: "نماذج جيت هب (GitHub Models)",
  isEnabled: false,
  requiredKeyName: "GitHub Token (PAT)",
  keyPlaceholder: "ghp_...",
  availableModels: [
    {
      id: "gpt-4o",
      name: "GPT-4o (GitHub Models)",
      description: "Multimodal flagship model hosted on GitHub Models",
    },
    {
      id: "gpt-4o-mini",
      name: "GPT-4o Mini (GitHub Models)",
      description: "Fast lightweight model hosted on GitHub Models",
    },
  ],
  createModel: () => {
    throw new Error("المزود ده (GitHub Models) لسه مش مفعّل");
  },
};

// ---------------------------------------------------------------------------
// Registry of all providers
// ---------------------------------------------------------------------------
export const AI_PROVIDERS: Record<string, AIProvider> = {
  gemini: geminiProvider,
  openrouter: openrouterProvider,
  "github-models": githubModelsProvider,
};

