"use client";

import { Search, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/components/shared/logo";
import { Spark } from "@/components/shared/spark";
import { Button } from "@/components/ui/button";
import { askNavHref, primaryNavigation } from "@/config/navigation";
import { cn } from "@/lib/utils/cn";
import { useAppShell } from "./app-shell-context";
import { isActivePath } from "./sidebar";
import { UserMenu } from "./user-menu";

export function MobileHeader() {
  const { openCommandPalette } = useAppShell();
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur-md md:hidden">
      <Link href="/today" aria-label="FixMyDay home">
        <Logo />
      </Link>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" onClick={openCommandPalette} aria-label="Search">
          <Search />
        </Button>
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href={askNavHref} aria-label="Ask AI">
            <Spark />
          </Link>
        </Button>
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/settings" aria-label="Settings">
            <Settings />
          </Link>
        </Button>
        <div className="ml-1">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

/**
 * Bottom navigation for phones. The centre button opens the AI planner — the
 * primary action — within thumb reach.
 */
export function MobileTabBar() {
  const pathname = usePathname();
  const { openPlanner } = useAppShell();
  const [first, second, third, fourth] = primaryNavigation;

  const renderTab = (item: (typeof primaryNavigation)[number]) => {
    const active = isActivePath(pathname, item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex h-14 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
          active ? "text-foreground" : "text-subtle-foreground",
        )}
      >
        <item.icon className="size-5" />
        {item.label}
      </Link>
    );
  };

  return (
    <nav
      aria-label="Main"
      className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-border bg-sidebar/90 backdrop-blur-md md:hidden"
    >
      <div className="flex items-center px-2">
        {renderTab(first)}
        {renderTab(second)}
        <div className="flex flex-1 justify-center">
          <button
            type="button"
            onClick={openPlanner}
            aria-label="Plan with AI"
            className="flex size-12 -translate-y-3 cursor-pointer items-center justify-center rounded-full bg-brand text-brand-foreground shadow-elevated transition-transform active:scale-95"
          >
            <Spark className="size-5 text-brand-foreground" />
          </button>
        </div>
        {renderTab(third)}
        {renderTab(fourth)}
      </div>
    </nav>
  );
}
