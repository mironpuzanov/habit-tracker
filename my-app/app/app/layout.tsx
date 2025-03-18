import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { AppSidebar, BottomNav } from "@/components/internal";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 w-full flex flex-row">
        <div className="hidden md:block">
          <AppSidebar />
        </div>
        <div className="flex-1 flex flex-col pb-16 md:pb-0">
          {children}
        </div>
      </div>
      <div className="md:hidden">
        <BottomNav />
      </div>
    </main>
  );
} 