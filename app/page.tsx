"use client";

import type { Session } from "@supabase/supabase-js";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";

type Bookmark = {
  id: string;
  title: string;
  url: string;
  created_at: string;
  user_id: string;
};

const normalizeUrl = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const candidate = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    return new URL(candidate).toString();
  } catch {
    return null;
  }
};

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [isLoadingBookmarks, setIsLoadingBookmarks] = useState(false);
  const [isSavingBookmark, setIsSavingBookmark] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const userId = session?.user.id ?? null;

  const fetchBookmarks = useCallback(async () => {
    if (!userId) {
      setBookmarks([]);
      return;
    }

    setIsLoadingBookmarks(true);
    setErrorMessage(null);

    const { data, error } = await supabase
      .from("bookmarks")
      .select("id, title, url, created_at, user_id")
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      setBookmarks([]);
    } else {
      setBookmarks(data ?? []);
    }

    setIsLoadingBookmarks(false);
  }, [userId]);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (error) {
        setErrorMessage(error.message);
      } else {
        setSession(data.session);
      }
    };

    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setBookmarks([]);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const channel = supabase
      .channel(`bookmarks-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void fetchBookmarks();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          void fetchBookmarks();
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchBookmarks, userId]);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setErrorMessage(error.message);
    }
  };

  const handleAddBookmark = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!userId) {
      setErrorMessage("Please sign in first.");
      return;
    }

    const normalized = normalizeUrl(url);
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setErrorMessage("Title is required.");
      return;
    }

    if (!normalized) {
      setErrorMessage("Please enter a valid URL.");
      return;
    }

    setIsSavingBookmark(true);
    setErrorMessage(null);

    const { error } = await supabase.from("bookmarks").insert({
      title: trimmedTitle,
      url: normalized,
      user_id: userId,
    });

    if (error) {
      setErrorMessage(error.message);
    } else {
      setTitle("");
      setUrl("");
      await fetchBookmarks();
    }

    setIsSavingBookmark(false);
  };

  const handleDeleteBookmark = async (bookmarkId: string) => {
    setDeletingId(bookmarkId);
    setErrorMessage(null);

    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", bookmarkId);

    if (error) {
      setErrorMessage(error.message);
    } else {
      await fetchBookmarks();
    }

    setDeletingId(null);
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-12 text-slate-900">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Smart Bookmark App
            </h1>
            <p className="text-sm text-slate-500">
              Private bookmarks synced in real time.
            </p>
          </div>

          {session ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Sign out
            </button>
          ) : (
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSigningIn ? "Redirecting..." : "Continue with Google"}
            </button>
          )}
        </header>

        {session && (
          <p className="mb-6 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Signed in as {session.user.email}
          </p>
        )}

        {errorMessage && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </p>
        )}

        {session ? (
          <>
            <form onSubmit={handleAddBookmark} className="mb-6 grid gap-3">
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Bookmark title"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-300 focus:ring"
              />
              <input
                type="text"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://example.com"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-300 focus:ring"
              />
              <button
                type="submit"
                disabled={isSavingBookmark}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingBookmark ? "Saving..." : "Add bookmark"}
              </button>
            </form>

            <section>
              <h2 className="mb-3 text-lg font-semibold">Your bookmarks</h2>
              {isLoadingBookmarks ? (
                <p className="text-sm text-slate-500">Loading bookmarks...</p>
              ) : bookmarks.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No bookmarks yet. Add your first one.
                </p>
              ) : (
                <ul className="space-y-3">
                  {bookmarks.map((bookmark) => (
                    <li
                      key={bookmark.id}
                      className="flex flex-col gap-3 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-slate-900">
                          {bookmark.title}
                        </p>
                        <a
                          href={bookmark.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {bookmark.url}
                        </a>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteBookmark(bookmark.id)}
                        disabled={deletingId === bookmark.id}
                        className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingId === bookmark.id ? "Deleting..." : "Delete"}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : (
          <p className="text-sm text-slate-500">
            Sign in with Google to manage private bookmarks.
          </p>
        )}
      </div>
    </main>
  );
}
