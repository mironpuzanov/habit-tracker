"use client";

import { useState } from "react";
import { FormMessage } from "@/components/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

// @ts-ignore - bypass NextJS type checking issues
export default function Page(props: any) {
  const router = useRouter();
  const searchParams = props.searchParams || {};
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<{
    type: "idle" | "loading" | "success" | "error";
    message?: string;
  }>({ type: "idle" });
  
  // Extract error message from search params if it exists
  const errorMessage = 
    searchParams.error && 
    (typeof searchParams.error === 'string' 
      ? searchParams.error 
      : searchParams.error[0]);

  // Client-side sign-in handler
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: "loading" });

    try {
      // Create a client-side Supabase client
      const supabase = createClient();
      console.log("Signing in with:", email);

      // Attempt to sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Sign-in error:", error);
        setStatus({ 
          type: "error", 
          message: error.message || "Failed to sign in. Please check your credentials." 
        });
      } else {
        console.log("Sign-in success:", data);
        setStatus({ type: "success" });
        // Redirect to dashboard
        router.push("/app/dashboard");
      }
    } catch (err) {
      console.error("Sign-in exception:", err);
      setStatus({ 
        type: "error", 
        message: "An unexpected error occurred. Please try again." 
      });
    }
  };

  return (
    <form onSubmit={handleSignIn} className="flex-1 flex flex-col min-w-64">
      <h1 className="text-2xl font-medium">Sign in</h1>
      <p className="text-sm text-foreground">
        Don't have an account?{" "}
        <Link className="text-foreground font-medium underline" href="/external/sign-up">
          Sign up
        </Link>
      </p>
      <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
        <Label htmlFor="email">Email</Label>
        <Input 
          id="email"
          name="email" 
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com" 
          required 
        />
        <div className="flex justify-between items-center">
          <Label htmlFor="password">Password</Label>
          <Link
            className="text-xs text-foreground underline"
            href="/external/forgot-password"
          >
            Forgot Password?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Your password"
          required
        />
        <Button 
          type="submit"
          disabled={status.type === "loading"}
        >
          {status.type === "loading" ? "Signing in..." : "Sign in"}
        </Button>
        
        {/* Display status messages */}
        {status.type === "error" && status.message && (
          <FormMessage message={{ error: status.message }} />
        )}
        {errorMessage && (
          <FormMessage message={{ error: errorMessage }} />
        )}
      </div>
    </form>
  );
}
