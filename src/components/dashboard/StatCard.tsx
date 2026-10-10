import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: "orange" | "navy";
  /** When set, the whole card becomes a real link to this destination
   * (e.g. Published Articles -> /dashboard/articles?status=published) —
   * not just a decorative cursor-pointer. Omit for a stat with no
   * meaningful drill-down page. */
  href?: string;
}

/**
 * `label` wraps instead of truncating: a fixed single line next to a 48px
 * icon box left too little room for longer labels (e.g. "Articles
 * Published"), which is why they were getting cut off. The label now gets
 * the card's full width on its own line under the value instead of sharing
 * a row with the icon.
 */
export function StatCard({ label, value, icon: Icon, accent = "orange", href }: StatCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between mb-3">
        <div
          className={`shrink-0 w-11 h-11 rounded-lg flex items-center justify-center ${
            accent === "orange" ? "bg-tmt-orange/10 text-tmt-orange" : "bg-tmt-navy/10 text-tmt-navy"
          }`}
        >
          <Icon size={20} />
        </div>
        {href && <ChevronRight size={16} className="text-gray-300 mt-1.5 shrink-0" />}
      </div>
      <p className="text-2xl font-bold text-tmt-navy leading-tight break-words">{value}</p>
      <p className="text-sm text-gray-500 leading-snug mt-0.5">{label}</p>
    </>
  );

  const className =
    "bg-white rounded-xl shadow-md p-4 sm:p-5 flex flex-col hover:shadow-lg transition-shadow duration-300 h-full";

  if (href) {
    return (
      <Link href={href} className={`${className} focus:outline-none focus:ring-2 focus:ring-tmt-orange/50`}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
