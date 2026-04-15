import type { Metadata } from "next";
import { getBlogPosts } from "@/lib/blog-api";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Clinical AI Blog — Healthcare AI, SOAP Notes & Medical Documentation",
  description:
    "Expert articles on AI medical scribing, SOAP note automation, ICD-10 coding, HIPAA compliance, and reducing documentation burden for doctors.",
  alternates: { canonical: "https://scribedesk.app/blog" },
  openGraph: {
    title: "Clinical AI Blog — ScribeDesk",
    description:
      "Expert articles on AI medical scribing, SOAP note automation, ICD-10 coding, HIPAA compliance, and reducing documentation burden for doctors.",
    url: "https://scribedesk.app/blog",
    type: "website",
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <>
      <Navbar />
      <main className="pt-14 min-h-screen bg-white">
        {/* Header */}
        <section className="border-b border-black/10 px-6 py-16">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs font-medium tracking-widest uppercase text-black/30 mb-3">
              ScribeDesk Blog
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-black leading-tight">
              Clinical AI Insights
            </h1>
            <p className="mt-3 text-base text-black/50 max-w-xl">
              Practical guides on AI medical scribing, documentation automation,
              and the future of clinical workflows — for doctors and healthcare
              teams.
            </p>
          </div>
        </section>

        {/* Post grid */}
        <section className="px-6 py-14">
          <div className="max-w-4xl mx-auto">
            {posts.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-black/10">
                <p className="text-black/30 text-sm">
                  First posts coming soon. Check back shortly.
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-px bg-black/10 border border-black/10">
                {posts.map((post) => (
                  <a
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="bg-white p-6 flex flex-col gap-3 hover:bg-gray-50 transition-colors group"
                  >
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-medium uppercase tracking-wide border border-black/15 text-black/40 px-2 py-0.5"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Title */}
                    <h2 className="text-base font-semibold text-black leading-snug group-hover:underline underline-offset-2">
                      {post.title}
                    </h2>

                    {/* Excerpt */}
                    <p className="text-sm text-black/50 leading-relaxed flex-1">
                      {post.excerpt}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center justify-between pt-2 border-t border-black/5">
                      <span className="text-xs text-black/30">
                        {post.published_at ? formatDate(post.published_at) : ""}
                      </span>
                      <span className="text-xs text-black/30">
                        {post.reading_time_mins} min read
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA strip */}
        <section className="border-t border-black/10 px-6 py-12 bg-black">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <p className="font-semibold text-white">See ScribeDesk in action</p>
              <p className="text-sm text-white/40 mt-0.5">
                Cut documentation time by up to 70% — request a demo today.
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
    </>
  );
}
