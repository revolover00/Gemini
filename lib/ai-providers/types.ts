export interface UserApiKey {
  id: string;
  studentId: string;
  provider: string; // "gemini" | "openrouter" | "github"
  keyName: string;
  apiKey: string;
  isDefault: boolean;
  status?: "active" | "exhausted" | "invalid";
  createdAt: string;
  updatedAt: string;
}

export interface StoredKeysState {
  keys: UserApiKey[];
  defaultKeyId?: string;
}
