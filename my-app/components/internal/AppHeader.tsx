import { signOutAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";

interface AppHeaderProps {
  title?: string;
}

export default async function AppHeader({ title = "Habit Tracker" }: AppHeaderProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="w-full flex justify-between items-center p-4 border-b">
      <h1 className="text-xl font-bold">{title}</h1>
      {user && (
        <div className="flex items-center gap-4">
          <span className="text-sm">Hello, {user.email}</span>
          <form action={signOutAction}>
            <Button type="submit" variant="outline" size="sm">
              Log out
            </Button>
          </form>
        </div>
      )}
    </header>
  );
} 