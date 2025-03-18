import { LandingHero } from "@/components/external";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <span>Habit Tracker</span>
            </div>
            <div className="flex gap-2">
              {/* Nav buttons are in the landing hero */}
            </div>
          </div>
        </nav>

        <div className="flex flex-col max-w-5xl p-3 sm:p-5 w-full">
          <div className="flex-1 w-full flex flex-col items-center">
            <LandingHero />
          </div>
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-10 sm:py-16 mt-10">
          <p>
            &copy; {new Date().getFullYear()} Habit Tracker
          </p>
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
} 