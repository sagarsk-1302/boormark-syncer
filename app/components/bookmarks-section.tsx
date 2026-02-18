"use client";

import type { Bookmark } from "@/lib/queries/bookmarks-queries";

type BookmarksSectionProps = {
  bookmarks: Bookmark[];
  isLoadingBookmarks: boolean;
  deletingId: string | null;
  onDeleteBookmark: (bookmarkId: string) => void;
};

export function BookmarksSection({
  bookmarks,
  isLoadingBookmarks,
  deletingId,
  onDeleteBookmark,
}: BookmarksSectionProps) {
  return (
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
                <p className="font-medium text-slate-900">{bookmark.title}</p>
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
                onClick={() => onDeleteBookmark(bookmark.id)}
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
  );
}
