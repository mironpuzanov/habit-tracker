"use client";

import { useState } from "react";
import { FormMessage } from "@/components/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function Page(props: any) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Ultra simple signup handler
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const supabase = createClient();
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });

      console.log("Signup response:", data, error);

      if (error) {
        setError(error.message);
      } else if (data?.user) {
        // Handle both confirmation modes
        if (data.user.identities?.[0]?.identity_data?.email_confirmed_at) {
          // Email confirmation is disabled, user is already confirmed
          setSuccess("Account created! Signing you in now...");
          // Auto sign-in since confirmation is disabled
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          
          if (!signInError) {
            setTimeout(() => router.push("/app/dashboard"), 1500);
          } else {
            setSuccess("Account created! Please sign in.");
            setTimeout(() => router.push("/external/sign-in"), 1500);
          }
        } else {
          // Email confirmation is enabled
          setSuccess("Account created successfully! Please check your email for confirmation link.");
        }
      }
    } catch (err) {
      console.error("Signup exception:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[60vh] w-full px-4 sm:px-6 md:px-8">
      <div className="w-full max-w-md bg-background/50 backdrop-blur-sm rounded-lg border border-border/50 shadow-sm p-5 sm:p-6 md:p-8">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center">Create Your Account</h1>
        
        {success ? (
          <div className="text-center mb-4 p-3 sm:p-4 bg-green-100 dark:bg-green-900 rounded">
            <p className="text-green-700 dark:text-green-300">{success}</p>
            {!success.includes("Signing you in") && !success.includes("Please sign in") && (
              <p className="text-xs sm:text-sm mt-2 text-gray-600 dark:text-gray-400">
                After confirming your email, you can{" "}
                <Link href="/external/sign-in" className="text-blue-600 dark:text-blue-400 underline">
                  sign in
                </Link>
                {" "}to your account.
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="mt-1 w-full text-sm"
              />
            </div>
            
            <div>
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                required
                className="mt-1 w-full text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
            </div>
            
            {error && (
              <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 p-3 rounded text-xs sm:text-sm">
                {error}
              </div>
            )}
            
            <Button
              type="submit"
              className="w-full mt-2"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </span>
              ) : "Sign Up"}
            </Button>
            
            <p className="text-center text-xs sm:text-sm mt-4">
              Already have an account?{" "}
              <Link href="/external/sign-in" className="text-blue-600 dark:text-blue-400 underline">
                Sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
