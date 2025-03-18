"use client";

import { useState } from "react";
import { FormMessage } from "@/components/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SmtpMessage } from "../smtp-message";
import { createClient } from "@/utils/supabase/client";

// @ts-ignore - bypass NextJS type checking issues
export default function Page(props: any) {
  const searchParams = props.searchParams || {};
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<{
    type: "idle" | "loading" | "success" | "error";
    message?: string;
  }>({ type: "idle" });

  // Extract success/error messages from search params
  const successMessage = 
    searchParams.success && 
    (typeof searchParams.success === 'string' 
      ? searchParams.success 
      : searchParams.success[0]);
    
  const errorMessage = 
    searchParams.error && 
    (typeof searchParams.error === 'string' 
      ? searchParams.error 
      : searchParams.error[0]);

  // Handle success message from URL params
  if (successMessage) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center gap-4 p-4">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold mb-2">Thanks for signing up!</h2>
          <p>Please check your email for a verification link.</p>
        </div>
        <FormMessage message={{ success: successMessage }} />
        <div className="mt-4">
          <Link className="text-primary underline" href="/external/sign-in">
            Return to sign in
          </Link>
        </div>
      </div>
    );
  }

  // Client-side sign-up handler
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: "loading" });

    try {
      // Create a client-side Supabase client
      const supabase = createClient();
      console.log("Signing up with:", email);

      // Attempt to sign up
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error("Sign-up error:", error);
        setStatus({ 
          type: "error", 
          message: error.message || "Failed to sign up. Please try again." 
        });
      } else {
        console.log("Sign-up success:", data);
        setStatus({ 
          type: "success", 
          message: "Thanks for signing up! Please check your email for a verification link." 
        });
      }
    } catch (err) {
      console.error("Sign-up exception:", err);
      setStatus({ 
        type: "error", 
        message: "An unexpected error occurred. Please try again." 
      });
    }
  };

  return (
    <>
      <form onSubmit={handleSignUp} className="flex flex-col min-w-64 max-w-64 mx-auto">
        <h1 className="text-2xl font-medium">Sign up</h1>
        <p className="text-sm text text-foreground">
          Already have an account?{" "}
          <Link className="text-primary font-medium underline" href="/external/sign-in">
            Sign in
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
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            minLength={6}
            required
          />
          <Button 
            type="submit"
            disabled={status.type === "loading"}
          >
            {status.type === "loading" ? "Signing up..." : "Sign up"}
          </Button>
          
          {/* Display status messages */}
          {status.type === "error" && status.message && (
            <FormMessage message={{ error: status.message }} />
          )}
          {status.type === "success" && status.message && (
            <FormMessage message={{ success: status.message }} />
          )}
          {errorMessage && (
            <FormMessage message={{ error: errorMessage }} />
          )}
        </div>
      </form>
      <SmtpMessage />
    </>
  );
}
