import { wrapLanguageModel } from "ai";

export type CustomMiddleware = Parameters<typeof wrapLanguageModel>[0]["middleware"];

export const customMiddleware: CustomMiddleware = {};

