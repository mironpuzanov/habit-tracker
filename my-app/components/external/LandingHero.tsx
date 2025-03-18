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
    <div className="flex flex-col items-center justify-center py-8 sm:py-16 px-4 text-center gap-4 sm:gap-6 w-full">
      <h1 className="text-3xl sm:text-5xl font-bold leading-tight">{title}</h1>
      <p className="text-lg sm:text-xl text-foreground/70 max-w-2xl">{subtitle}</p>
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4 sm:mt-6 w-full sm:w-auto">
        <Button asChild variant="default" size="lg" className="w-full sm:w-auto">
          <Link href="/external/sign-up">Get Started</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
          <Link href="/external/sign-in">Sign In</Link>
        </Button>
      </div>
    </div>
  );
} 