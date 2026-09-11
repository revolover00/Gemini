"use client";

import {
  AlertTriangle,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Key,
  Plus,
  ShieldAlert,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";


import {
  AI_PROVIDERS,
  AIProvider,
  deleteUserApiKey,
  getStoredUserApiKeys,
  saveUserApiKey,
  setDefaultApiKey,
  UserApiKey,
} from "@/ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ApiKeysSettingsPage() {
  const [keys, setKeys] = useState<UserApiKey[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Form states
  const [selectedProvider, setSelectedProvider] = useState<string>("gemini");
  const [keyName, setKeyName] = useState("");
  const [apiKeyValue, setApiKeyValue] = useState("");
  const [setAsDefault, setSetAsDefault] = useState(false);
  const [showKeyText, setShowKeyText] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const providersList: AIProvider[] = Object.values(AI_PROVIDERS);
  const currentProviderInfo = AI_PROVIDERS[selectedProvider] || AI_PROVIDERS.gemini;

  const loadKeys = () => {
    const stored = getStoredUserApiKeys();
    setKeys(stored);
    setIsLoaded(true);
  };

  useEffect(() => {
    loadKeys();

    const handleStorageChange = () => {
      loadKeys();
    };

    window.addEventListener("user_api_keys_changed", handleStorageChange);
    return () => {
      window.removeEventListener("user_api_keys_changed", handleStorageChange);
    };
  }, []);

  const handleAddKey = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMessage(null);

    if (!apiKeyValue.trim()) {
      setFeedbackMessage({
        type: "error",
        text: "يرجى كتابة أو لصق مفتاح الـ API أولاً",
      });
      return;
    }

    const defaultName =
      keyName.trim() ||
      `${currentProviderInfo.name} (${new Date().toLocaleDateString("ar-EG")})`;

    saveUserApiKey({
      studentId: "default-student",
      provider: selectedProvider,
      keyName: defaultName,
      apiKey: apiKeyValue.trim(),
      isDefault: setAsDefault,
    });

    setKeyName("");
    setApiKeyValue("");
    setSetAsDefault(false);
    setShowKeyText(false);
    loadKeys();

    setFeedbackMessage({
      type: "success",
      text: `تم حفظ مفتاح ${currentProviderInfo.name} بنجاح!`,
    });

    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4000);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`هل أنت متأكد من حذف المفتاح "${name}"؟`)) {
      deleteUserApiKey(id);
      loadKeys();
    }
  };

  const handleSetDefault = (id: string) => {
    setDefaultApiKey(id);
    loadKeys();
  };

  const maskKey = (key: string) => {
    if (!key || key.length < 8) return "••••••••";
    return key.substring(0, 6) + "••••••••" + key.substring(key.length - 4);
  };

  return (
    <div className="min-h-dvh bg-background text-foreground pt-20 pb-16 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Key className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight">
                إدارة مفاتيح الـ API (API Keys)
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              أضف مفاتيح الذكاء الاصطناعي الخاصة بك لاستخدامها في الشات والمساعد الذكي.
            </p>
          </div>

          <Link href="/">
            <Button variant="outline" className="gap-2 self-start md:self-auto">
              <ArrowRight className="w-4 h-4" />
              الرجوع إلى الشات
            </Button>
          </Link>
        </div>

        {/* Security Warning Banner */}
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div className="text-sm space-y-1">
            <p className="font-semibold">تنبيه أمان ومرحلة التطوير التجريبية:</p>
            <p className="text-xs md:text-sm leading-relaxed opacity-90">
              يتم تخزين المفاتيح حاليًا محليًا داخل متصفحك (localStorage) لهذه المرحلة التجريبية.
              سيتم تشفير المفاتيح وتخزينها بأمان تام عبر قاعدة بيانات Supabase المشفرة في التحديث القادم.
            </p>
          </div>
        </div>

        {/* Add New Key Card */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-border/40 pb-4">
            <Plus className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">إضافة مفتاح API جديد</h2>
          </div>

          <form onSubmit={handleAddKey} className="space-y-5">
            {/* Provider Selector */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">اختر مزود الذكاء الاصطناعي:</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {providersList.map((provider) => {
                  const isSelected = selectedProvider === provider.id;
                  return (
                    <button
                      key={provider.id}
                      type="button"
                      onClick={() => setSelectedProvider(provider.id)}
                      className={`p-3.5 rounded-xl border text-right transition-all flex flex-col justify-between gap-2 ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "border-border/60 hover:border-border hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium text-sm">{provider.name}</span>
                        {provider.isEnabled ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-medium">
                            مفعّل الآن
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 font-medium">
                            قيد التجهيز
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {provider.displayNameArabic}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Provider Status Note */}
            {!currentProviderInfo.isEnabled && (
              <div className="p-3 rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-800 dark:text-blue-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  مزود <strong>{currentProviderInfo.name}</strong> في مرحلة التجهيز (Placeholder). يمكنك إضافة مفتاحك مسبقًا وسيتم تشغيله فور إتاحة المزود رسميًا.
                </span>
              </div>
            )}

            {/* Key Name / Label */}
            <div className="space-y-2">
              <Label htmlFor="keyName" className="text-sm font-medium">
                اسم تعريفي للمفتاح (اختياري):
              </Label>
              <Input
                id="keyName"
                placeholder={`مثلاً: مفتاحي الشخصي - ${currentProviderInfo.name}`}
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                className="text-right"
              />
            </div>

            {/* API Key Input */}
            <div className="space-y-2">
              <Label htmlFor="apiKey" className="text-sm font-medium flex items-center justify-between">
                <span>{currentProviderInfo.requiredKeyName}:</span>
                <span className="text-xs text-muted-foreground font-normal">
                  {currentProviderInfo.keyPlaceholder}
                </span>
              </Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showKeyText ? "text" : "password"}
                  placeholder={`ألصق ${currentProviderInfo.requiredKeyName} هنا`}
                  value={apiKeyValue}
                  onChange={(e) => setApiKeyValue(e.target.value)}
                  className="font-mono text-sm pl-10 text-left"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowKeyText(!showKeyText)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showKeyText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Set as Default Checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                id="isDefaultCheckbox"
                type="checkbox"
                checked={setAsDefault}
                onChange={(e) => setSetAsDefault(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="isDefaultCheckbox" className="text-sm cursor-pointer select-none">
                تعيين هذا المفتاح كافتراضي للشات
              </label>
            </div>

            {/* Feedback Message */}
            {feedbackMessage && (
              <div
                className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                  feedbackMessage.type === "success"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                }`}
              >
                {feedbackMessage.type === "success" ? (
                  <Check className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>{feedbackMessage.text}</span>
              </div>
            )}

            <Button type="submit" className="w-full gap-2">
              <Check className="w-4 h-4" />
              حفظ المفتاح
            </Button>
          </form>
        </div>

        {/* Existing Saved Keys List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span>المفاتيح المحفوظة</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {keys.length}
              </span>
            </h2>
          </div>

          {!isLoaded ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              جاري تحميل المفاتيح...
            </div>
          ) : keys.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-border/80 text-center space-y-3 bg-card/50">
              <Key className="w-8 h-8 text-muted-foreground mx-auto opacity-50" />
              <div className="space-y-1">
                <p className="font-medium text-sm">لا توجد أي مفاتيح محفوظة بعد</p>
                <p className="text-xs text-muted-foreground">
                  أضف مفتاح Google Gemini أعلاه لتتمكن من بدء المحادثة مع المساعد الذكي.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {keys.map((item) => {
                const providerObj = AI_PROVIDERS[item.provider] || AI_PROVIDERS.gemini;
                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border transition-all bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      item.isDefault
                        ? "border-primary/50 shadow-sm ring-1 ring-primary/20"
                        : "border-border/60 hover:border-border"
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{item.keyName}</span>
                        {item.isDefault && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" />
                            الافتراضي
                          </span>
                        )}
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                          {providerObj?.name || item.provider}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground" dir="ltr">
                        <span>{maskKey(item.apiKey)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {!item.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefault(item.id)}
                          className="text-xs gap-1 hover:text-primary"
                        >
                          <Star className="w-3.5 h-3.5" />
                          تعيين كافتراضي
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id, item.keyName)}
                        className="text-xs gap-1 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        حذف
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
