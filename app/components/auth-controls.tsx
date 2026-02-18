"use client";

import type { Session } from "@supabase/supabase-js";
import { useState } from "react";
import { supabase } from "@/lib/supabase-browser";

type AuthControlsProps = {
  session: Session | null;
  onError: (message: string | null) => void;
};

export function AuthControls({ session, onError }: AuthControlsProps) {
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    onError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      onError(error.message);
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    onError(null);
    const { error } = await supabase.auth.signOut();
    if (error) {
      onError(error.message);
    }
  };

  if (session) {
    return (
      <button
        type="button"
        onClick={handleSignOut}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
      >
        Sign out
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={isSigningIn}
      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isSigningIn ? "Redirecting..." : "Continue with Google"}
    </button>
  );
}
