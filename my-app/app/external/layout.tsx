import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default function ExternalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-10 md:gap-20 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-4 md:px-5 text-sm">
            <div className="flex gap-3 md:gap-5 items-center font-semibold">
              <Link href={"/"} className="text-base md:text-lg">Habit Tracker</Link>
            </div>
            <div className="flex gap-2">
              <Button asChild size="sm" variant={"outline"} className="text-xs md:text-sm px-2 md:px-4">
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button asChild size="sm" variant={"default"} className="text-xs md:text-sm px-2 md:px-4">
                <Link href="/sign-up">Sign up</Link>
              </Button>
            </div>
          </div>
        </nav>

        <div className="flex flex-col gap-10 md:gap-20 max-w-5xl px-4 md:px-5 w-full">
          {children}
        </div>

        <footer className="w-full flex flex-col md:flex-row items-center justify-center border-t mx-auto text-center text-xs gap-4 md:gap-8 py-8 md:py-16">
          <p>
            &copy; {new Date().getFullYear()} Habit Tracker
          </p>
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}
