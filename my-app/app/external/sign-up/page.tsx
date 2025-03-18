import { signUpAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { SmtpMessage } from "../smtp-message";

export default async function Signup({ searchParams }: { searchParams: { [key: string]: string | undefined } }) {
  // Create a message object from query parameters
  const message: Message | Record<string, never> = searchParams.success
    ? { success: searchParams.success }
    : searchParams.error
    ? { error: searchParams.error }
    : {};

  // If we have a success message, show only that
  if (searchParams.success) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center gap-4 p-4">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold mb-2">Thanks for signing up!</h2>
          <p>Please check your email for a verification link.</p>
        </div>
        <FormMessage message={{ success: searchParams.success }} />
        <div className="mt-4">
          <Link className="text-primary underline" href="/external/sign-in">
            Return to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <form className="flex flex-col min-w-64 max-w-64 mx-auto">
        <h1 className="text-2xl font-medium">Sign up</h1>
        <p className="text-sm text text-foreground">
          Already have an account?{" "}
          <Link className="text-primary font-medium underline" href="/external/sign-in">
            Sign in
          </Link>
        </p>
        <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
          <Label htmlFor="email">Email</Label>
          <Input name="email" placeholder="you@example.com" required />
          <Label htmlFor="password">Password</Label>
          <Input
            type="password"
            name="password"
            placeholder="Your password"
            minLength={6}
            required
          />
          <SubmitButton formAction={signUpAction} pendingText="Signing up...">
            Sign up
          </SubmitButton>
          {searchParams.error && (
            <FormMessage message={{ error: searchParams.error }} />
          )}
        </div>
      </form>
      <SmtpMessage />
    </>
  );
}
