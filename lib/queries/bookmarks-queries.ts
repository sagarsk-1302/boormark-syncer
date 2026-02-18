import { supabase } from "@/lib/supabase-browser";

export type Bookmark = {
  id: string;
  title: string;
  url: string;
  created_at: string;
  user_id: string;
};

type InsertBookmarkParams = {
  title: string;
  url: string;
  userId: string;
};

export const fetchBookmarksQuery = async () =>
  supabase
    .from("bookmarks")
    .select("id, title, url, created_at, user_id")
    .order("created_at", { ascending: false });

export const insertBookmarkQuery = async ({
  title,
  url,
  userId,
}: InsertBookmarkParams) =>
  supabase.from("bookmarks").insert({
    title,
    url,
    user_id: userId,
  });

export const deleteBookmarkQuery = async (bookmarkId: string) =>
  supabase.from("bookmarks").delete().eq("id", bookmarkId);
