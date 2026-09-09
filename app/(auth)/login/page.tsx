"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { AuthForm } from "@/components/custom/auth-form";
import { UserIcon } from "@/components/custom/icons";
import { SubmitButton } from "@/components/custom/submit-button";
import { Button } from "@/components/ui/button";

import { login, loginAsGuest, LoginActionState } from "../actions";

export default function Page() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [isGuestLoading, setIsGuestLoading] = useState(false);

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    login,
    {
      status: "idle",
    },
  );

  useEffect(() => {
    if (state.status === "failed") {
      toast.error("Invalid credentials!");
    } else if (state.status === "invalid_data") {
      toast.error("Failed validating your submission!");
    } else if (state.status === "success") {
      router.refresh();
    }
  }, [state.status, router]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get("email") as string);
    formAction(formData);
  };

  const handleGuestLogin = async () => {
    try {
      setIsGuestLoading(true);
      const res = await loginAsGuest();
      if (res.status === "success") {
        toast.success("Welcome! You are browsing as a guest.");
        router.push("/");
        router.refresh();
      } else {
        toast.error("Failed to sign in as guest!");
        setIsGuestLoading(false);
      }
    } catch {
      toast.error("Failed to sign in as guest!");
      setIsGuestLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">Sign In</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Use your email and password to sign in
          </p>
        </div>
        <AuthForm action={handleSubmit} defaultEmail={email}>
          <SubmitButton>Sign in</SubmitButton>

          <div className="relative my-2 flex items-center justify-center">
            <div className="border-t border-zinc-200 dark:border-zinc-800 w-full absolute" />
            <span className="bg-background px-2 text-xs text-muted-foreground uppercase relative">
              Or
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={isGuestLoading}
            onClick={handleGuestLogin}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium"
          >
            <UserIcon />
            <span>
              {isGuestLoading ? "Entering as Guest..." : "Continue as Guest / الدخول كـ زائر"}
            </span>
          </Button>

          <p className="text-center text-sm text-gray-600 mt-2 dark:text-zinc-400">
            {"Don't have an account? "}
            <Link
              href="/register"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              Sign up
            </Link>
            {" for free."}
          </p>
        </AuthForm>
      </div>
    </div>
  );
}
