import React from "react";
import Link from "next/link";

export const mdxComponents = {
  h1: ({ children, id, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1
      id={id}
      className="editorial-heading text-4xl md:text-5xl font-normal text-slate-900 mt-12 mb-6 first:mt-0"
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, id, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2
      id={id}
      className="editorial-heading text-2xl md:text-3xl font-normal text-slate-900 mt-12 mb-4 scroll-mt-24 group"
      {...props}
    >
      <a href={`#${id}`} className="no-underline hover:underline decoration-sky-500/30 underline-offset-4">
        {children}
      </a>
    </h2>
  ),
  h3: ({ children, id, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3
      id={id}
      className="editorial-heading text-xl md:text-2xl font-normal text-slate-800 mt-8 mb-3 scroll-mt-24"
      {...props}
    >
      {children}
    </h3>
  ),
  p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="text-slate-600 leading-[1.8] mb-6 text-[16px]" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-disc pl-6 mb-6 space-y-2 text-slate-600 leading-[1.8] text-[16px]" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="list-decimal pl-6 mb-6 space-y-2 text-slate-600 leading-[1.8] text-[16px]" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="pl-1" {...props}>
      {children}
    </li>
  ),
  blockquote: ({ children, ...props }: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="border-l-4 border-sky-500 pl-6 my-6 italic text-slate-500"
      {...props}
    >
      {children}
    </blockquote>
  ),
  table: ({ children, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="overflow-x-auto mb-6 rounded-xl border border-slate-200">
      <table className="w-full text-sm text-slate-600" {...props}>
        {children}
      </table>
    </div>
  ),
  th: ({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <th className="bg-slate-50 px-4 py-3 text-left font-semibold text-slate-700 border-b border-slate-200" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <td className="px-4 py-3 border-b border-slate-100" {...props}>
      {children}
    </td>
  ),
  a: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const isExternal = href?.startsWith("http");
    if (isExternal) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-600 hover:text-sky-700 underline underline-offset-2 decoration-sky-500/30 hover:decoration-sky-500"
          {...props}
        >
          {children}
        </a>
      );
    }
    return (
      <Link href={href || "#"} className="text-sky-600 hover:text-sky-700 underline underline-offset-2 decoration-sky-500/30 hover:decoration-sky-500" {...props}>
        {children}
      </Link>
    );
  },
  strong: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-semibold text-slate-800" {...props}>
      {children}
    </strong>
  ),
  hr: () => <hr className="my-10 border-slate-200" />,
  code: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <code className="bg-slate-100 text-sky-700 px-1.5 py-0.5 rounded text-[14px] font-mono" {...props}>
      {children}
    </code>
  ),
};
