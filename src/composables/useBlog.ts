import type { Post, PostStatus, PostSummary } from "../../shared/blog";
import { useAuth } from "./useAuth";

export type { Post, PostStatus, PostSummary };

export interface SavePostInput {
  /** Present when editing an existing post. */
  slug?: string;
  title: string;
  body: string;
  cover: string;
  tags: string[];
  action: "save" | "submit" | "publish";
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { session } = useAuth();
  const headers = new Headers(init.headers);
  const token = session.value?.access_token;
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body) headers.set("Content-Type", "application/json");

  const res = await fetch(path, { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Request failed.");
  return data as T;
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });
}

/** Client for the /api/blog endpoints; the article store itself is server-side. */
export function useBlog() {
  return {
    listPublished: () => request<PostSummary[]>("/api/blog/posts"),
    listMine: () => request<PostSummary[]>("/api/blog/posts?scope=mine"),
    listForReview: () => request<PostSummary[]>("/api/blog/posts?scope=review"),
    getPost: (slug: string) => request<Post>(`/api/blog/post?slug=${encodeURIComponent(slug)}`),
    savePost: (input: SavePostInput) =>
      request<{ slug: string; status: PostStatus }>("/api/blog/post", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    deletePost: (slug: string) =>
      request<{ ok: true }>(`/api/blog/post?slug=${encodeURIComponent(slug)}`, { method: "DELETE" }),
    reviewPost: (slug: string, decision: "approve" | "reject") =>
      request<{ status: PostStatus }>("/api/blog/review", {
        method: "POST",
        body: JSON.stringify({ slug, decision }),
      }),
    async uploadImage(file: File): Promise<string> {
      const { url } = await request<{ url: string }>("/api/blog/image", {
        method: "POST",
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          data: await toBase64(file),
        }),
      });
      return url;
    },
  };
}
