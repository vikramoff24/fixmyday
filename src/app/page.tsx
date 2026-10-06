import { ArrowRight, Brain, CalendarClock, Sparkles } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/shared/logo";
import { Spark } from "@/components/shared/spark";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { LandingDemo } from "@/features/marketing/components/landing-demo";
import { getCurrentUserId } from "@/lib/auth/session";

const PRINCIPLES = [
  {
    icon: Brain,
    title: "Understands you",
    body: "Write the way you think. Dates, times, priorities and durations are picked up for you.",
  },
  {
    icon: CalendarClock,
    title: "Plans realistically",
    body: "Works around what's already on your day, adds breathing room and flags conflicts.",
  },
  {
    icon: Sparkles,
    title: "You stay in control",
    body: "Nothing changes until you accept. Edit, reorganize or ask for a better plan anytime.",
  },
];

export default async function LandingPage() {
  const isSignedIn = Boolean(await getCurrentUserId());
  const primaryHref = isSignedIn ? "/today" : "/sign-up";

  return (
    <div className="relative min-h-dvh overflow-hidden">
      {/* One soft wash of "first light" behind the hero — deliberately subtle. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 h-[560px] bg-[radial-gradient(ellipse_at_center,var(--brand-soft),transparent_65%)] opacity-80"
      />

      <header className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8">
        <Logo />
        <nav className="flex items-center gap-2" aria-label="Account">
          {isSignedIn ? (
            <Button asChild size="sm">
              <Link href="/today">Open FixMyDay</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/sign-up">Get started</Link>
              </Button>
            </>
          )}
        </nav>
      </header>

      <main className="relative">
        <section className="mx-auto flex max-w-4xl flex-col items-center px-5 pt-16 text-center md:pt-24">
          <h1 className="text-[40px] leading-[1.05] font-semibold tracking-[-0.035em] text-balance md:text-[64px]">
            Your thoughts are messy.
            <br />
            <span className="text-muted-foreground">Your day doesn&apos;t have to be.</span>
          </h1>
          <p className="mt-6 flex max-w-md items-start gap-2 text-left text-[17px] leading-relaxed text-muted-foreground md:items-center md:text-center">
            <Spark className="mt-1.5 md:mt-0" />
            <span>
              {siteConfig.name} turns everything on your mind into a simple plan you can actually follow.
            </span>
          </p>
          <Button asChild variant="brand" size="lg" className="mt-9">
            <Link href={primaryHref}>
              Start planning
              <ArrowRight />
            </Link>
          </Button>
        </section>

        <section aria-label="How it works" className="px-5 pt-20 md:pt-24">
          <LandingDemo />
        </section>

        <section className="mx-auto grid max-w-5xl gap-10 px-5 pt-24 pb-24 md:grid-cols-3 md:gap-12 md:px-8 md:pt-32">
          {PRINCIPLES.map((principle) => (
            <div key={principle.title} className="flex flex-col gap-3">
              <principle.icon className="size-5 text-brand-text" aria-hidden />
              <h2 className="text-[15px] font-medium tracking-tight">{principle.title}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{principle.body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="relative border-t border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 text-xs text-subtle-foreground md:px-8">
          <span>
            © {new Date().getFullYear()} {siteConfig.name}
          </span>
          <span>Thoughts → Plan → Action</span>
        </div>
      </footer>
    </div>
  );
}
