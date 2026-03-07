import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Script from "next/script";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { getPostBySlug, getAllSlugs } from "@/lib/blog";
import { BlogPostLayout } from "@/components/blog/blog-post-layout";
import { mdxComponents } from "@/components/blog/mdx-components";
import type { BlogFrontmatter } from "@/lib/blog";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  const { frontmatter } = post;

  return {
    title: `${frontmatter.title} | HazLabel Blog`,
    description: frontmatter.description,
    keywords: frontmatter.keywords,
    alternates: {
      canonical: `https://www.hazlabel.co/blog/${slug}`,
    },
    openGraph: {
      title: frontmatter.title,
      description: frontmatter.description,
      url: `https://www.hazlabel.co/blog/${slug}`,
      siteName: "HazLabel",
      type: "article",
      publishedTime: frontmatter.publishedAt,
      authors: [frontmatter.author],
    },
    twitter: {
      card: "summary_large_image",
      title: frontmatter.title,
      description: frontmatter.description,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const { content } = await compileMDX<BlogFrontmatter>({
    source: post.content,
    components: mdxComponents,
    options: {
      parseFrontmatter: false,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug],
      },
    },
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.frontmatter.title,
    description: post.frontmatter.description,
    datePublished: post.frontmatter.publishedAt,
    author: {
      "@type": "Organization",
      name: post.frontmatter.author,
      url: "https://www.hazlabel.co",
    },
    publisher: {
      "@type": "Organization",
      name: "HazLabel",
      url: "https://www.hazlabel.co",
      logo: {
        "@type": "ImageObject",
        url: "https://www.hazlabel.co/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://www.hazlabel.co/blog/${slug}`,
    },
    keywords: post.frontmatter.keywords.join(", "),
  };

  return (
    <>
      <Script
        id={`json-ld-article-${slug}`}
        type="application/ld+json"
        strategy="afterInteractive"
      >
        {JSON.stringify(jsonLd)}
      </Script>
      <BlogPostLayout frontmatter={post.frontmatter} heroImage={post.frontmatter.image}>
        {content}
      </BlogPostLayout>
    </>
  );
}
