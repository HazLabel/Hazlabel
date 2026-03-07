import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BlogCTA() {
  return (
    <div className="my-14 -mx-4 sm:mx-0">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 md:p-10 text-center">
        {/* Decorative orbs */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-sky-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-cyan-500/15 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-lg mx-auto space-y-4">
          <p className="text-xs font-medium uppercase tracking-wider text-sky-400">
            Automate Your Compliance
          </p>
          <h3 className="editorial-heading text-2xl md:text-3xl text-white">
            Generate GHS Labels in Seconds
          </h3>
          <p className="text-sm md:text-base text-slate-400 leading-relaxed">
            Upload your SDS and let AI extract hazard data, validate against GHS
            Rev 11, and generate print-ready labels — no manual work required.
          </p>
          <div className="pt-2">
            <Button
              asChild
              className="bg-sky-500 hover:bg-sky-600 text-white font-semibold px-8 py-3 rounded-full text-sm shadow-lg shadow-sky-500/25 transition-all hover:shadow-sky-500/40"
            >
              <Link
                href="/login"
                className="inline-flex items-center gap-2"
              >
                Try HazLabel Free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            No credit card required
          </p>
        </div>
      </div>
    </div>
  );
}
