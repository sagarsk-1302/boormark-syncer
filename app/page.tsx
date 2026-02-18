"use client";

import type { Session } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { AuthControls } from "@/app/components/auth-controls";
import { BookmarkForm } from "@/app/components/bookmark-form";
import { BookmarksSection } from "@/app/components/bookmarks-section";
import {
  type Bookmark,
  deleteBookmarkQuery,
  fetchBookmarksQuery,
} from "@/lib/queries/bookmarks-queries";
import { supabase } from "@/lib/supabase-browser";

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoadingBookmarks, setIsLoadingBookmarks] = useState(false);
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

    const { data, error } = await fetchBookmarksQuery();

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

  const handleDeleteBookmark = async (bookmarkId: string) => {
    setDeletingId(bookmarkId);
    setErrorMessage(null);

    const { error } = await deleteBookmarkQuery(bookmarkId);

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

          <AuthControls session={session} onError={setErrorMessage} />
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
            <BookmarkForm
              userId={session.user.id}
              onError={setErrorMessage}
              onBookmarkAdded={fetchBookmarks}
            />

            <BookmarksSection
              bookmarks={bookmarks}
              isLoadingBookmarks={isLoadingBookmarks}
              deletingId={deletingId}
              onDeleteBookmark={handleDeleteBookmark}
            />
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
