import { UserApiKey } from "./types";

/**
 * ⚠️ ملاحظة أمان مهمة (Security Warning):
 * يتم تخزين مفاتيح المستخدمين مؤقتًا في localStorage خلال هذه المرحلة التجريبية (Mock Phase).
 * عند ربط قاعدة بيانات Supabase لاحقًا، يجب تشفير المفاتيح باستخدام خوارزمية تشفير قوية (مثل AES-256-GCM)
 * قبل حفظها في جدول user_api_keys.
 */

const STORAGE_KEY = "gemini_chatbot_user_api_keys";

export function getStoredUserApiKeys(): UserApiKey[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to parse user API keys from localStorage:", error);
    return [];
  }
}

export function saveUserApiKey(
  keyData: Omit<UserApiKey, "id" | "createdAt" | "updatedAt"> & { id?: string },
): UserApiKey {
  const currentKeys = getStoredUserApiKeys();
  const now = new Date().toISOString();

  let updatedKey: UserApiKey;

  if (keyData.id) {
    const existingIndex = currentKeys.findIndex((k) => k.id === keyData.id);
    if (existingIndex >= 0) {
      updatedKey = {
        ...currentKeys[existingIndex],
        ...keyData,
        updatedAt: now,
      };
      currentKeys[existingIndex] = updatedKey;
    } else {
      updatedKey = {
        id: keyData.id,
        studentId: keyData.studentId || "default-student",
        provider: keyData.provider,
        keyName: keyData.keyName,
        apiKey: keyData.apiKey,
        isDefault: Boolean(keyData.isDefault),
        createdAt: now,
        updatedAt: now,
      };
      currentKeys.push(updatedKey);
    }
  } else {
    const newId = `key_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const shouldBeDefault =
      keyData.isDefault || currentKeys.length === 0 || !currentKeys.some((k) => k.isDefault);

    updatedKey = {
      id: newId,
      studentId: keyData.studentId || "default-student",
      provider: keyData.provider,
      keyName: keyData.keyName,
      apiKey: keyData.apiKey,
      isDefault: shouldBeDefault,
      createdAt: now,
      updatedAt: now,
    };

    currentKeys.push(updatedKey);
  }

  // If this key is set as default, unset others
  if (updatedKey.isDefault) {
    for (const k of currentKeys) {
      if (k.id !== updatedKey.id) {
        k.isDefault = false;
      }
    }
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentKeys));
    window.dispatchEvent(new Event("user_api_keys_changed"));
  }

  return updatedKey;
}

export function deleteUserApiKey(keyId: string): void {
  const currentKeys = getStoredUserApiKeys();
  const filtered = currentKeys.filter((k) => k.id !== keyId);

  // If deleted key was default, make the first remaining key default
  const deletedWasDefault = currentKeys.some((k) => k.id === keyId && k.isDefault);
  if (deletedWasDefault && filtered.length > 0) {
    filtered[0].isDefault = true;
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new Event("user_api_keys_changed"));
  }
}

export function setDefaultApiKey(keyId: string): void {
  const currentKeys = getStoredUserApiKeys();
  let found = false;

  for (const k of currentKeys) {
    if (k.id === keyId) {
      k.isDefault = true;
      found = true;
    } else {
      k.isDefault = false;
    }
  }

  if (found && typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentKeys));
    window.dispatchEvent(new Event("user_api_keys_changed"));
  }
}

export function getDefaultApiKey(preferredProvider?: string): UserApiKey | null {
  const currentKeys = getStoredUserApiKeys();
  if (currentKeys.length === 0) return null;

  if (preferredProvider) {
    const providerDefault = currentKeys.find(
      (k) => k.provider === preferredProvider && k.isDefault,
    );
    if (providerDefault) return providerDefault;

    const providerAny = currentKeys.find((k) => k.provider === preferredProvider);
    if (providerAny) return providerAny;
  }

  const defaultKey = currentKeys.find((k) => k.isDefault);
  if (defaultKey) return defaultKey;

  return currentKeys[0] || null;
}
