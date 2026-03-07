import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { BlogCard } from "@/components/blog/blog-card";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog | HazLabel - GHS Compliance & Chemical Safety Insights",
  description:
    "Expert guides on GHS compliance, chemical safety labeling, SDS management, and regulatory updates for chemical manufacturers.",
  alternates: {
    canonical: "https://www.hazlabel.co/blog",
  },
  openGraph: {
    title: "Blog | HazLabel",
    description:
      "Expert guides on GHS compliance, chemical safety labeling, and regulatory updates.",
    url: "https://www.hazlabel.co/blog",
    siteName: "HazLabel",
    type: "website",
  },
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="glass-nav fixed top-0 w-full z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between py-4">
          <Link href="/" className="flex items-center">
            <Image src="/logo.png" alt="HazLabel" width={140} height={35} className="h-8 w-auto" />
          </Link>
          <div className="hidden md:flex items-center gap-10">
            <Link href="/#features" className="text-[13px] uppercase tracking-[0.1em] font-medium text-slate-500 hover:text-slate-900 transition-colors">Features</Link>
            <Link href="/#how-it-works" className="text-[13px] uppercase tracking-[0.1em] font-medium text-slate-500 hover:text-slate-900 transition-colors">How it Works</Link>
            <Link href="/pricing" className="text-[13px] uppercase tracking-[0.1em] font-medium text-slate-500 hover:text-slate-900 transition-colors">Pricing</Link>
            <Link href="/blog" className="text-[13px] uppercase tracking-[0.1em] font-medium text-sky-600 hover:text-sky-700 transition-colors">Blog</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors hidden sm:block">
              Sign In
            </Link>
            <Button asChild className="bg-sky-600 hover:bg-sky-700 text-white font-semibold px-6 py-2.5 rounded-full text-sm shadow-lg shadow-sky-500/20">
              <Link href="/login">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative pt-32 pb-16 overflow-hidden hero-mesh">
        <div className="orb orb-blue w-[400px] h-[400px] -top-40 -right-40 opacity-60" />
        <div className="orb orb-cyan w-[300px] h-[300px] -bottom-20 -left-20 opacity-40" />

        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <span className="inline-block px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-sky-700 bg-sky-50 border border-sky-200/50 rounded-full mb-6">
            Insights & Guides
          </span>
          <h1 className="editorial-heading text-5xl md:text-6xl lg:text-7xl text-slate-900 mb-4">
            The HazLabel <span className="gradient-text italic">Blog</span>
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed">
            Expert guides on GHS compliance, chemical safety labeling, and regulatory updates for manufacturers.
          </p>
        </div>
      </header>

      {/* Posts Grid */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        {posts.length === 0 ? (
          <p className="text-center text-slate-400">No posts yet. Check back soon.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <BlogCard key={post.slug} slug={post.slug} frontmatter={post.frontmatter} />
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
            <p>&copy; 2026 HazLabel. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/disclaimer" className="hover:text-white transition-colors">Safety Disclaimer</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
