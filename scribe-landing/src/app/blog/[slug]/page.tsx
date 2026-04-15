import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBlogPost, getBlogPosts } from "@/lib/blog-api";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

// Pre-render all known slugs at build time; new slugs render on first request then cache
export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.meta_description,
    keywords: post.tags.join(", "),
    alternates: { canonical: `https://scribedesk.app/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.meta_description,
      url: `https://scribedesk.app/blog/${slug}`,
      type: "article",
      publishedTime: post.published_at,
      siteName: "ScribeDesk",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.meta_description,
    },
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.meta_description,
    datePublished: post.published_at,
    dateModified: post.published_at,
    keywords: post.tags.join(", "),
    author: {
      "@type": "Organization",
      name: "ScribeDesk",
      url: "https://scribedesk.app",
    },
    publisher: {
      "@type": "Organization",
      name: "ScribeDesk",
      url: "https://scribedesk.app",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://scribedesk.app/blog/${slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        // Escape </script> sequences inside JSON-LD to prevent XSS
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <Navbar />
      <main className="pt-14 min-h-screen bg-white">
        {/* Article header */}
        <header className="border-b border-black/10 px-6 py-14">
          <div className="max-w-2xl mx-auto">
            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-medium uppercase tracking-wide border border-black/15 text-black/40 px-2 py-0.5"
                >
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-black leading-snug">
              {post.title}
            </h1>
            <p className="mt-3 text-base text-black/50 leading-relaxed">
              {post.excerpt}
            </p>
            <div className="flex items-center gap-4 mt-5 text-xs text-black/30">
              {post.published_at && <span>{formatDate(post.published_at)}</span>}
              <span>·</span>
              <span>{post.reading_time_mins} min read</span>
              <span>·</span>
              <span>ScribeDesk</span>
            </div>
          </div>
        </header>

        {/* Article body */}
        <article className="px-6 py-12">
          <div
            className="max-w-2xl mx-auto blog-content"
            dangerouslySetInnerHTML={{ __html: post.content_html }}
          />
        </article>

        {/* Back to blog */}
        <div className="px-6 pb-4">
          <div className="max-w-2xl mx-auto">
            <a
              href="/blog"
              className="text-xs text-black/40 hover:text-black transition-colors"
            >
              ← All articles
            </a>
          </div>
        </div>

        {/* CTA strip */}
        <section className="border-t border-black/10 mt-10 px-6 py-12 bg-black">
          <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <p className="font-semibold text-white">
                Ready to reclaim your evenings?
              </p>
              <p className="text-sm text-white/40 mt-0.5">
                ScribeDesk writes your SOAP notes, prescriptions, and letters
                while you focus on your patient.
              </p>
            </div>
            <a
              href="https://scribedesk.app#demo"
              className="shrink-0 bg-white text-black text-sm font-medium px-5 py-2.5 hover:bg-white/90 transition-colors"
            >
              Request a Demo
            </a>
          </div>
        </section>
      </main>
      <Footer />

      {/* Blog content typography styles */}
      <style>{`
        .blog-content h2 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-top: 2.5rem;
          margin-bottom: 0.75rem;
          color: #000;
          line-height: 1.35;
        }
        .blog-content h3 {
          font-size: 1.05rem;
          font-weight: 600;
          margin-top: 1.75rem;
          margin-bottom: 0.5rem;
          color: #000;
          line-height: 1.4;
        }
        .blog-content p {
          font-size: 0.9375rem;
          line-height: 1.75;
          color: rgba(0,0,0,0.7);
          margin-bottom: 1.1rem;
        }
        .blog-content ul {
          margin: 1rem 0 1.25rem 1.25rem;
          list-style-type: disc;
        }
        .blog-content li {
          font-size: 0.9375rem;
          line-height: 1.7;
          color: rgba(0,0,0,0.7);
          margin-bottom: 0.3rem;
        }
        .blog-content a {
          color: #000;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .blog-content a:hover {
          opacity: 0.6;
        }
      `}</style>
    </>
  );
}
