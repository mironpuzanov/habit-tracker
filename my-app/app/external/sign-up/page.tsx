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
      
      // Absolute minimal signup - no options, no redirects
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });

      console.log("Signup response:", data, error);

      if (error) {
        setError(error.message);
      } else if (data?.user) {
        setSuccess("Account created successfully! Redirecting to dashboard...");
        
        // Try to sign in directly
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (!signInError) {
          // Redirect to dashboard on success
          setTimeout(() => router.push("/app/dashboard"), 1000);
        } else {
          setSuccess("Account created! Please sign in.");
          setTimeout(() => router.push("/external/sign-in"), 1000);
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
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="w-full max-w-md p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Create an Account</h1>
        
        {success ? (
          <div className="text-center mb-4 p-4 bg-green-100 dark:bg-green-900 rounded">
            <p className="text-green-700 dark:text-green-300">{success}</p>
            <Link href="/external/sign-in" className="text-blue-600 dark:text-blue-400 underline mt-2 inline-block">
              Sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                required
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
            </div>
            
            {error && (
              <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 p-3 rounded">
                {error}
              </div>
            )}
            
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </Button>
            
            <p className="text-center text-sm">
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
