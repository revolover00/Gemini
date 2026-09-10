import Image from "next/image";
import Link from "next/link";

import { auth } from "@/app/(auth)/auth";

import { History } from "./history";
import { SlashIcon } from "./icons";
import { ThemeToggle } from "./theme-toggle";

export const Navbar = async () => {
  const session = await auth();

  return (
    <header className="bg-background/80 backdrop-blur-sm fixed top-0 inset-x-0 w-full py-2.5 px-4 justify-between flex flex-row items-center z-30 border-b border-border/40">
      <div className="flex flex-row gap-3 items-center">
        <History user={session?.user} />
        <Link
          href="/"
          className="flex flex-row gap-2 items-center hover:opacity-80 transition-opacity"
        >
          <Image
            src="/images/gemini-logo.png"
            height={20}
            width={20}
            alt="gemini logo"
          />
          <div className="text-zinc-400">
            <SlashIcon size={16} />
          </div>
          <span className="text-sm font-medium dark:text-zinc-200">
            Gemini Chatbot
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  );
};

