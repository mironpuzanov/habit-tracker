import Link from "next/link";
import { Button } from "@/components/ui/button";

interface LandingHeroProps {
  title?: string;
  subtitle?: string;
}

export default function LandingHero({
  title = "Track Your Habits Easily",
  subtitle = "Build better habits and achieve your goals with our simple habit tracking app."
}: LandingHeroProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center gap-6">
      <h1 className="text-4xl sm:text-5xl font-bold">{title}</h1>
      <p className="text-xl text-foreground/70 max-w-2xl">{subtitle}</p>
      <div className="flex gap-4 mt-6">
        <Button asChild variant="default" size="lg">
          <Link href="/external/sign-up">Get Started</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/external/sign-in">Sign In</Link>
        </Button>
      </div>
    </div>
  );
} 