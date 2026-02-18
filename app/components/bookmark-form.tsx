"use client";

import { FormEvent, useState } from "react";
import { insertBookmarkQuery } from "@/lib/queries/bookmarks-queries";

type BookmarkFormProps = {
  userId: string;
  onError: (message: string | null) => void;
  onBookmarkAdded: () => Promise<void>;
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

export function BookmarkForm({
  userId,
  onError,
  onBookmarkAdded,
}: BookmarkFormProps) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [isSavingBookmark, setIsSavingBookmark] = useState(false);

  const handleAddBookmark = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalized = normalizeUrl(url);
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      onError("Title is required.");
      return;
    }

    if (!normalized) {
      onError("Please enter a valid URL.");
      return;
    }

    setIsSavingBookmark(true);
    onError(null);

    const { error } = await insertBookmarkQuery({
      title: trimmedTitle,
      url: normalized,
      userId,
    });

    if (error) {
      onError(error.message);
    } else {
      setTitle("");
      setUrl("");
      await onBookmarkAdded();
    }

    setIsSavingBookmark(false);
  };

  return (
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
  );
}
