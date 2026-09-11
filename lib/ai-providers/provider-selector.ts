import { LanguageModel } from "ai";

import {
  AI_PROVIDERS,
  AIProvider,
  ModelType,
} from "./provider-config";
import { getStoredUserApiKeys, UserApiKey } from "./user-keys-storage";

export const DEFAULT_PROVIDER_ID = "gemini";
export const NO_API_KEY_ERROR = "NO_API_KEY";
export const ALL_KEYS_EXHAUSTED_ERROR = "ALL_KEYS_EXHAUSTED";
export const INVALID_KEY_ERROR = "INVALID_KEY";

export interface GetActiveModelOptions {
  apiKey?: string;
  preferredProvider?: string;
  modelType?: ModelType;
}

/**
 * Returns the requested provider definition.
 * Defaults to 'gemini' if not specified.
 */
export function getProvider(providerId: string = DEFAULT_PROVIDER_ID): AIProvider {
  const normalizedId = (providerId || DEFAULT_PROVIDER_ID).toLowerCase().trim();
  const provider = AI_PROVIDERS[normalizedId];

  if (!provider) {
    throw new Error(`المزود (${providerId}) غير معروف أو غير مدعوم`);
  }

  return provider;
}


/**
 * Returns the active LanguageModel instance for the given provider and model type,
 * using the student's personal API key.
 *
 * If apiKey is missing, throws Error("NO_API_KEY").
 * If the selected provider is a disabled placeholder, throws a descriptive Arabic error.
 */
export function getActiveModel(
  optionsOrProvider?: GetActiveModelOptions | string,
  modelType: ModelType = "pro",
): LanguageModel {

  let resolvedApiKey: string | undefined;
  let resolvedProviderId: string = DEFAULT_PROVIDER_ID;
  let resolvedModelType: ModelType = modelType;

  if (typeof optionsOrProvider === "object" && optionsOrProvider !== null) {
    resolvedApiKey = optionsOrProvider.apiKey;
    resolvedProviderId = optionsOrProvider.preferredProvider || DEFAULT_PROVIDER_ID;
    resolvedModelType = optionsOrProvider.modelType || "pro";
  } else if (typeof optionsOrProvider === "string") {
    resolvedProviderId = optionsOrProvider;
  }

  // Fallback to environment variable if DEV_TESTING_MODE is true
  if (!resolvedApiKey || resolvedApiKey.trim() === "") {
    if (resolvedProviderId === "gemini" && process.env.DEV_TESTING_MODE === "true") {
      resolvedApiKey =
        process.env.GEMINI_API_KEY ||
        process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
        "";
    }
  }

  if (!resolvedApiKey || resolvedApiKey.trim() === "") {
    const error = new Error("لازم تضيف مفتاح API من الإعدادات الأول");
    error.name = NO_API_KEY_ERROR;
    throw error;
  }

  const provider = getProvider(resolvedProviderId);

  if (!provider.isEnabled) {
    throw new Error(`المزود ده (${provider.name}) لسه مش مفعّل`);
  }

  return provider.createModel(resolvedApiKey.trim(), resolvedModelType);
}

/**
 * Returns a list of all registered providers with their metadata and activation status.
 */
export function getAllProviders(): AIProvider[] {
  return Object.values(AI_PROVIDERS);
}

