import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BlogFrontmatter } from "@/lib/blog";

interface BlogPostLayoutProps {
  frontmatter: BlogFrontmatter;
  children: React.ReactNode;
}

export function BlogPostLayout({ frontmatter, children }: BlogPostLayoutProps) {
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
      <header className="relative pt-32 pb-12 overflow-hidden hero-mesh">
        <div className="orb orb-blue w-[400px] h-[400px] -top-40 -right-40 opacity-60" />
        <div className="orb orb-cyan w-[300px] h-[300px] -bottom-20 -left-20 opacity-40" />

        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-sky-600 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>

          <div className="mb-4">
            <span className="inline-block px-3 py-1 text-xs font-medium uppercase tracking-wider text-sky-700 bg-sky-50 border border-sky-200/50 rounded-full">
              {frontmatter.category}
            </span>
          </div>

          <h1 className="editorial-heading text-4xl md:text-5xl lg:text-6xl text-slate-900 mb-6 max-w-3xl">
            {frontmatter.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <span className="font-medium text-slate-700">{frontmatter.author}</span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {new Date(frontmatter.publishedAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {frontmatter.readTime}
            </span>
          </div>
        </div>
      </header>

      {/* Content + Sidebar */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex gap-12">
          {/* Article */}
          <article className="min-w-0 max-w-3xl flex-1">
            {children}
          </article>

          {/* Sidebar CTA */}
          <aside className="hidden lg:block w-80 shrink-0">
            <div className="sticky top-28">
              <div className="glass-card-landing rounded-2xl p-6 space-y-4">
                <h3 className="editorial-heading text-xl text-slate-900">
                  Generate GHS Labels in Seconds
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Upload your SDS and let AI extract hazard data, validate against GHS Rev 11, and generate print-ready labels.
                </p>
                <Button asChild className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-full shadow-lg shadow-sky-500/20">
                  <Link href="/login" className="flex items-center justify-center gap-2">
                    Try HazLabel Free
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <p className="text-xs text-slate-400 text-center">
                  No credit card required
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

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
