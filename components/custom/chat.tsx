"use client";

import { useChat } from "@ai-sdk/react";
import { Attachment, Message } from "ai";
import { AlertCircle, ArrowLeft, Key, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";


import { getDefaultApiKey, UserApiKey, markKeyStatus, getNextAvailableKey } from "@/ai";
import { Message as PreviewMessage } from "@/components/custom/message";
import { useScrollToBottom } from "@/components/custom/use-scroll-to-bottom";
import { Button } from "@/components/ui/button";

import { MultimodalInput } from "./multimodal-input";

export function Chat({
  id,
  initialMessages,
}: {
  id: string;
  initialMessages: Array<Message>;
}) {
  const [activeKey, setActiveKey] = useState<UserApiKey | null>(null);
  const [hasCheckedStorage, setHasCheckedStorage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const checkKey = () => {
      const key = getDefaultApiKey();
      setActiveKey(key);
      setHasCheckedStorage(true);
    };

    checkKey();

    const handleStorageChange = () => {
      checkKey();
    };

    window.addEventListener("user_api_keys_changed", handleStorageChange);
    return () => {
      window.removeEventListener("user_api_keys_changed", handleStorageChange);
    };
  }, []);

  const {
    messages,
    handleSubmit: baseHandleSubmit,
    input,
    setInput,
    append,
    isLoading,
    stop,
    reload,
  } = useChat({
    id,
    body: {
      id,
      apiKey: activeKey?.apiKey || "",
      provider: activeKey?.provider || "gemini",
    },
    initialMessages,
    maxSteps: 10,
    onError: (error) => {
      const msg = error.message?.toLowerCase() || "";
      
      // 1. Quota Exceeded / 429
      if (msg.includes("429") || msg.includes("quota") || msg.includes("exhausted") || msg.includes("resource_exhausted")) {
        if (activeKey) {
          markKeyStatus(activeKey.id, "exhausted");
          const nextKey = getNextAvailableKey(activeKey.id);
          if (nextKey) {
            setActiveKey(nextKey);
            setErrorMessage("تم استنفاد حصة المفتاح، جاري التبديل والمحاولة تلقائياً...");
            setTimeout(() => {
              setErrorMessage(null);
              reload();
            }, 1500);
          } else {
            setErrorMessage("ALL_KEYS_EXHAUSTED");
          }
        }
      } 
      // 2. Invalid Key / 401 / 403
      else if (msg.includes("401") || msg.includes("403") || msg.includes("invalid_key") || msg.includes("invalid api key")) {
        if (activeKey) {
          markKeyStatus(activeKey.id, "invalid");
        }
        setErrorMessage("INVALID_KEY");
      }
      // 3. Missing Key
      else if (
        msg.includes("no_api_key") ||
        msg.includes("مفتاح api") ||
        msg.includes("400")
      ) {
        setErrorMessage("لازم تضيف مفتاح API من الإعدادات الأول");
      } else {
        setErrorMessage(error.message || "حدث خطأ أثناء التواصل مع النموذج");
      }
    },
    onFinish: () => {
      window.history.replaceState({}, "", `/chat/${id}`);
    },
  });

  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);

  const handleSubmit = (
    e?: { preventDefault?: () => void },
    chatRequestOptions?: any,
  ) => {
    if (e?.preventDefault) {
      e.preventDefault();
    }

    if (!activeKey?.apiKey) {
      setErrorMessage("لازم تضيف مفتاح API من الإعدادات الأول");
      return;
    }

    setErrorMessage(null);
    baseHandleSubmit(e, {
      ...chatRequestOptions,
      body: {
        ...(chatRequestOptions?.body || {}),
        id,
        apiKey: activeKey.apiKey,
        provider: activeKey.provider,
      },
    });
  };

  return (
    <div className="flex flex-row justify-center pb-4 md:pb-8 h-dvh bg-background pt-14">
      <div className="flex flex-col justify-between items-center gap-4 w-full max-w-3xl">
        {/* Missing API Key Warning Banner */}
        {hasCheckedStorage && !activeKey && (
          <div className="w-full px-4 pt-2">
            <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <p className="font-semibold text-sm">
                    لازم تضيف مفتاح API من الإعدادات الأول
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    الذكاء الاصطناعي بيشتغل بمفتاحك الشخصي، ضيف مفتاح Gemini بتاعك للبدء.
                  </p>
                </div>
              </div>
              <Link href="/settings/api-keys" className="shrink-0 w-full sm:w-auto">
                <Button size="sm" className="w-full sm:w-auto gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white border-0">
                  <Key className="w-3.5 h-3.5" />
                  إعدادات الـ API
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Active Key Indicator */}
        {hasCheckedStorage && activeKey && (
          <div className="w-full px-4 pt-1 flex justify-end">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/60 border border-border/40 text-[11px] text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>المزود النشط: <strong>Google Gemini</strong></span>
              <span className="opacity-70">({activeKey.keyName})</span>
            </div>
          </div>
        )}

        {/* Error notification */}
        {errorMessage && errorMessage !== "ALL_KEYS_EXHAUSTED" && errorMessage !== "INVALID_KEY" && (
          <div className="w-full px-4">
            <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              {!activeKey && (
                <Link href="/settings/api-keys">
                  <Button size="sm" variant="outline" className="h-7 text-xs border-rose-500/40 hover:bg-rose-500/20">
                    إضافة مفتاح
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Exhausted or Invalid Key Error Banner */}
        {(errorMessage === "ALL_KEYS_EXHAUSTED" || errorMessage === "INVALID_KEY") && (
          <div className="w-full px-4 pt-2">
            <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-500/10 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                <div>
                  <p className="font-semibold text-sm">
                    {errorMessage === "ALL_KEYS_EXHAUSTED" 
                      ? "عفواً، تم استنفاد حصة جميع المفاتيح المتاحة."
                      : "عفواً، المفتاح الحالي غير صالح (Invalid Key)."}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    يرجى مراجعة إعدادات المفاتيح وإضافة مفتاح جديد لتتمكن من المتابعة.
                  </p>
                </div>
              </div>
              <Link href="/settings/api-keys" className="shrink-0 w-full sm:w-auto">
                <Button size="sm" className="w-full sm:w-auto gap-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white border-0">
                  <Key className="w-3.5 h-3.5" />
                  إدارة المفاتيح
                </Button>
              </Link>
            </div>
          </div>
        )}

        <div
          ref={messagesContainerRef}
          className="flex flex-col gap-4 h-full w-full px-4 items-center overflow-y-scroll"
        >
          {messages.map((message) => (
            <PreviewMessage
              key={message.id}
              chatId={id}
              role={message.role}
              content={message.content}
              attachments={message.experimental_attachments}
              toolInvocations={message.toolInvocations}
            />
          ))}

          <div
            ref={messagesEndRef}
            className="shrink-0 min-w-[24px] min-h-[24px]"
          />
        </div>

        <form className="flex flex-row gap-2 relative items-end w-full md:max-w-[500px] max-w-[calc(100dvw-32px)] px-4 md:px-0">
          {(errorMessage === "ALL_KEYS_EXHAUSTED" || errorMessage === "INVALID_KEY" || (!hasCheckedStorage && !activeKey)) && (
            <div className="absolute inset-0 z-10 rounded-2xl bg-background/50 backdrop-blur-[1px]" />
          )}
          <MultimodalInput
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            stop={stop}
            attachments={attachments}
            setAttachments={setAttachments}
            messages={messages}
            append={append}
          />
        </form>
      </div>
    </div>
  );
}

