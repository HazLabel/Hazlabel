import Link from "next/link";
import { Calendar, Clock } from "lucide-react";
import type { BlogFrontmatter } from "@/lib/blog";

interface BlogCardProps {
  slug: string;
  frontmatter: BlogFrontmatter;
}

export function BlogCard({ slug, frontmatter }: BlogCardProps) {
  return (
    <Link href={`/blog/${slug}`} className="group block">
      <article className="glass-card-landing rounded-2xl p-6 h-full flex flex-col">
        {/* Category Badge */}
        <div className="mb-4">
          <span className="inline-block px-3 py-1 text-xs font-medium uppercase tracking-wider text-sky-700 bg-sky-50 border border-sky-200/50 rounded-full">
            {frontmatter.category}
          </span>
        </div>

        {/* Title */}
        <h2 className="editorial-heading text-xl md:text-2xl text-slate-900 mb-3 group-hover:text-sky-700 transition-colors leading-snug">
          {frontmatter.title}
        </h2>

        {/* Description */}
        <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-1 line-clamp-3">
          {frontmatter.description}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(frontmatter.publishedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {frontmatter.readTime}
          </span>
        </div>
      </article>
    </Link>
  );
}
