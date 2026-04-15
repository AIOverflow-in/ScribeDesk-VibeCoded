const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

export interface BlogPostSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
  target_keyword: string;
  reading_time_mins: number;
  published_at: string;
}

export interface BlogPostFull extends BlogPostSummary {
  meta_description: string;
  content_html: string;
}

export async function getBlogPosts(limit = 50): Promise<BlogPostSummary[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/blogs?limit=${limit}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function getBlogPost(slug: string): Promise<BlogPostFull | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/blogs/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
