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
      const supabase = createClient();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Sign-in error:", error);
        let errorMessage = "Failed to sign in. Please check your credentials.";
        
        // More specific error messages
        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Incorrect email or password. Please try again.";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "Please confirm your email address before signing in. Check your inbox for the confirmation link.";
        } else if (error.message.includes("rate limit")) {
          errorMessage = "Too many sign-in attempts. Please try again in a few minutes.";
        }
        
        setStatus({ 
          type: "error", 
          message: errorMessage 
        });
      } else {
        setStatus({ type: "success" });
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
    <div className="flex justify-center items-center min-h-[60vh] w-full px-4 sm:px-6 md:px-8">
      <div className="w-full max-w-md bg-background/50 backdrop-blur-sm rounded-lg border border-border/50 shadow-sm p-5 sm:p-6 md:p-8">
        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="text-center mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl font-bold">Sign in</h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2">
              Don't have an account?{" "}
              <Link className="text-blue-600 dark:text-blue-400 underline" href="/external/sign-up">
                Sign up
              </Link>
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input 
                id="email"
                name="email" 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" 
                required 
                className="mt-1 w-full text-sm"
              />
            </div>

            <div>
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Link
                  className="text-xs text-gray-600 dark:text-gray-400 hover:underline"
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
                className="mt-1 w-full text-sm"
              />
            </div>

            {(status.type === "error" && status.message) && (
              <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 p-3 rounded text-xs sm:text-sm">
                {status.message}
              </div>
            )}
            
            {errorMessage && (
              <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 p-3 rounded text-xs sm:text-sm">
                {errorMessage}
              </div>
            )}

            <Button 
              type="submit"
              className="w-full mt-2"
              disabled={status.type === "loading"}
            >
              {status.type === "loading" ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : "Sign in"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
