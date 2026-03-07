import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BlogFrontmatter } from "@/lib/blog";

interface BlogPostLayoutProps {
  frontmatter: BlogFrontmatter;
  heroImage?: string;
  children: React.ReactNode;
}

export function BlogPostLayout({ frontmatter, heroImage, children }: BlogPostLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="glass-nav fixed top-0 w-full z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between py-4">
          <Link href="/" className="flex items-center">
            <Image src="/logo.png" alt="HazLabel" width={140} height={35} className="h-8 w-auto" />
          </Link>
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

      {/* Hero Image */}
      {heroImage && (
        <div className="max-w-4xl mx-auto px-6 -mt-2">
          <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden shadow-xl">
            <Image
              src={heroImage}
              alt={frontmatter.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      )}

      {/* Content + Sidebar */}
      <div className="relative max-w-7xl mx-auto px-6 py-12">
        {/* Article — centered */}
        <article className="max-w-3xl mx-auto">
          {children}
        </article>

        {/* Sidebar CTA — floats independently on xl screens */}
        <aside className="hidden xl:block absolute top-12 right-6 w-72">
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
