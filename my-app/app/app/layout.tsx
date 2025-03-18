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
        <div className="flex-1 flex flex-col pb-20 md:pb-0 px-4 md:px-6 pt-4 md:pt-6">
          <div className="max-w-4xl mx-auto w-full">
            {children}
          </div>
        </div>
      </div>
      <div className="md:hidden">
        <BottomNav />
      </div>
    </main>
  );
} 