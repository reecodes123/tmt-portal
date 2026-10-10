"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  BarChart3,
  Bookmark,
  Calendar,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Heart,
  Loader2,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { StatCard } from "./StatCard";
import { fetchAnalytics } from "@/lib/api-client";
import { exportAnalyticsCsv, exportAnalyticsPdf } from "@/lib/analytics-export";
import type { AnalyticsPayload } from "@/server/repositories/analytics";

interface Props {
  initialData: AnalyticsPayload;
  initialPreset: string;
}

const PRESETS: { key: string; label: string }[] = [
  { key: "3d", label: "Past 3 Days" },
  { key: "7d", label: "Past 7 Days" },
  { key: "1m", label: "Past 1 Month" },
  { key: "2m", label: "Past 2 Months" },
  { key: "3m", label: "Past 3 Months" },
  { key: "6m", label: "Past 6 Months" },
  { key: "1y", label: "Past 1 Year" },
  { key: "all", label: "All Time" },
];

/** TMT brand palette for chart series — the real site tokens, not generic defaults. */
const CHART_COLORS = ["#FF7D00", "#062F3D", "#FA9721", "#0a4a5e", "#B67210", "#8F5C0D"];

/**
 * Analytics dashboard.
 *
 * Two honestly-different kinds of numbers are shown, and labelled as such:
 *   - RANGE-FILTERED (visits, articles published): genuinely backed by
 *     per-day data (DailyVisit, Article.publishedAt), so these update with
 *     the date-range picker.
 *   - ALL-TIME (views, likes, bookmarks, top articles, views-by-category):
 *     Article.views/likes/bookmarks are lifetime counters with no per-day
 *     breakdown in the database — there is nothing to filter by date. These
 *     sections carry an explicit "All-Time" badge rather than silently
 *     pretending to respect the selected range. See
 *     server/repositories/analytics.ts's file-top comment for the full
 *     reasoning.
 */
export function AnalyticsView({ initialData, initialPreset }: Props) {
  const [data, setData] = useState(initialData);
  const [preset, setPreset] = useState(initialPreset);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);

  const loadRange = (params: { preset?: string; from?: string; to?: string }) => {
    setError("");
    startTransition(async () => {
      try {
        const fresh = await fetchAnalytics(params);
        setData(fresh);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load analytics for this range.");
      }
    });
  };

  const handlePresetChange = (key: string) => {
    setPreset(key);
    setUseCustom(false);
    loadRange({ preset: key });
  };

  const handleApplyCustom = () => {
    if (!customFrom) return;
    setUseCustom(true);
    loadRange({ from: customFrom, to: customTo || undefined });
  };

  const handleExport = async (format: "csv" | "pdf") => {
    setExporting(format);
    try {
      if (format === "csv") {
        exportAnalyticsCsv("The Matrix Today", data);
      } else {
        // jsPDF/jspdf-autotable are fetched on demand inside this call — see
        // analytics-export.ts's top comment — so this await now covers a
        // real network+parse cost, not just synchronous PDF assembly.
        await exportAnalyticsPdf("The Matrix Today", data);
      }
    } finally {
      setExporting(null);
    }
  };

  const visitsChartData = data.visitsOverTime.map((v) => ({
    date: v.date.slice(5), // MM-DD, compact for the x-axis
    fullDate: v.date,
    Visitors: v.visitors,
  }));

  const publishedChartData = data.publishedOverTime.map((p) => ({
    period: p.period.slice(5),
    Published: p.count,
  }));

  const categoryDonutData = data.articlesByCategoryInRange.map((c) => ({
    name: c.categoryName,
    value: c.count,
  }));

  const viewsByCategoryData = data.allTime.viewsByCategory
    .slice(0, 8)
    .map((c) => ({ name: c.categoryName, Views: c.views }));

  const topArticlesData = data.allTime.topArticles
    .slice(0, 8)
    .map((a) => ({ name: a.title.length > 22 ? `${a.title.slice(0, 21)}…` : a.title, Views: a.views }));

  return (
    <div className="space-y-6">
      {/* ---------- Date range + export controls ---------- */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-2 min-w-0">
            <Calendar size={18} className="text-tmt-orange shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-tmt-navy">Date Range</p>
              <p className="text-xs text-gray-500">
                Showing: <span className="font-medium text-tmt-navy">{data.range.label}</span>
              </p>
            </div>
            {isPending && <Loader2 size={16} className="animate-spin text-tmt-orange shrink-0 mt-1" />}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleExport("csv")}
              disabled={exporting !== null}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {exporting === "csv" ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
              CSV
            </button>
            <button
              onClick={() => handleExport("pdf")}
              disabled={exporting !== null}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-tmt-orange hover:bg-tmt-orange-light text-white text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {exporting === "pdf" ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
              PDF Report
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => handlePresetChange(p.key)}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                !useCustom && preset === p.key
                  ? "bg-tmt-orange text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-2 pt-2 border-t border-gray-100">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Custom from</label>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="px-2 py-1.5 border-2 border-gray-200 rounded-lg text-sm focus:border-tmt-orange focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">to</label>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="px-2 py-1.5 border-2 border-gray-200 rounded-lg text-sm focus:border-tmt-orange focus:outline-none"
            />
          </div>
          <button
            onClick={handleApplyCustom}
            disabled={!customFrom}
            className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              useCustom ? "bg-tmt-navy text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Apply Custom Range
          </button>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
            {error}
          </p>
        )}
      </div>

      {/* ---------- KPI cards ---------- */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-tmt-navy/50 mb-2">
          {data.range.label}
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Visits" value={data.totalVisitsInRange} icon={TrendingUp} />
          <StatCard
            label="Articles Published"
            value={data.articlesPublishedInRange}
            icon={FileText}
            accent="navy"
            href="/dashboard/articles"
          />
          <StatCard label="Active Editors" value={data.allTime.activeEditors} icon={Users} href="/dashboard/users" />
          <StatCard
            label="Unread Feedback"
            value={data.allTime.unreadFeedback}
            icon={BarChart3}
            accent="navy"
            href="/dashboard/feedback"
          />
        </div>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-tmt-navy/50 mb-2">
          All-Time
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Article Views"
            value={data.allTime.totalViews}
            icon={Eye}
            accent="navy"
            href="/dashboard/articles"
          />
          <StatCard label="Total Likes" value={data.allTime.totalLikes} icon={Heart} href="/dashboard/articles" />
          <StatCard
            label="Total Bookmarks"
            value={data.allTime.totalBookmarks}
            icon={Bookmark}
            accent="navy"
            href="/dashboard/articles"
          />
          <StatCard
            label="Published Articles"
            value={data.allTime.publishedArticles}
            icon={FileText}
            href="/dashboard/articles?status=published"
          />
        </div>
      </div>

      {/* Most viewed spotlight — not a plain number, needs its own card, and
          each is a real link to where you'd actually act on it (edit the
          article; see everything else in that category). */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data.allTime.mostViewedArticle ? (
          <Link
            href={`/dashboard/articles/${data.allTime.mostViewedArticle.id}/edit`}
            className="bg-white rounded-xl shadow-md p-5 flex items-center gap-4 hover:shadow-lg transition-shadow"
          >
            <div className="w-12 h-12 rounded-lg bg-tmt-orange/10 text-tmt-orange flex items-center justify-center shrink-0">
              <Star size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500">Most Viewed Article (all-time)</p>
              <p className="font-bold text-tmt-navy line-clamp-2 leading-snug">
                {data.allTime.mostViewedArticle.title}
              </p>
              <p className="text-sm text-gray-500">
                {data.allTime.mostViewedArticle.views.toLocaleString()} views ·{" "}
                {data.allTime.mostViewedArticle.categoryName}
              </p>
            </div>
            <ChevronRight size={18} className="text-gray-300 shrink-0" />
          </Link>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-tmt-orange/10 text-tmt-orange flex items-center justify-center shrink-0">
              <Star size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Most Viewed Article (all-time)</p>
              <p className="text-sm text-gray-400">No published articles yet.</p>
            </div>
          </div>
        )}

        {data.allTime.mostViewedCategory ? (
          <Link
            href={`/dashboard/articles?category=${data.allTime.mostViewedCategory.categorySlug}`}
            className="bg-white rounded-xl shadow-md p-5 flex items-center gap-4 hover:shadow-lg transition-shadow"
          >
            <div className="w-12 h-12 rounded-lg bg-tmt-navy/10 text-tmt-navy flex items-center justify-center shrink-0">
              <BarChart3 size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500">Most Viewed Category (all-time)</p>
              <p className="font-bold text-tmt-navy line-clamp-2 leading-snug">
                {data.allTime.mostViewedCategory.categoryName}
              </p>
              <p className="text-sm text-gray-500">
                {data.allTime.mostViewedCategory.views.toLocaleString()} views
              </p>
            </div>
            <ChevronRight size={18} className="text-gray-300 shrink-0" />
          </Link>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-tmt-navy/10 text-tmt-navy flex items-center justify-center shrink-0">
              <BarChart3 size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Most Viewed Category (all-time)</p>
              <p className="text-sm text-gray-400">No views recorded yet.</p>
            </div>
          </div>
        )}
      </div>

      {/* ---------- Visits over time (line) ---------- */}
      <div className="bg-white rounded-xl shadow-md p-5 sm:p-6">
        <h2 className="font-bold text-tmt-navy mb-1">Visits Over Time</h2>
        <p className="text-xs text-gray-500 mb-4">{data.range.label}</p>
        {visitsChartData.length === 0 ? (
          <EmptyChart message="No visits recorded yet for this range." />
        ) : (
          <div className="h-64 sm:h-72 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={visitsChartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" allowDecimals={false} />
                <Tooltip
                  formatter={(value: number) => [value, "Visitors"]}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate ?? ""}
                  contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13 }}
                />
                <Line type="monotone" dataKey="Visitors" stroke="#FF7D00" strokeWidth={2.5} dot={{ r: 2 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ---------- Published over time + category donut ---------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl shadow-md p-5 sm:p-6">
          <h2 className="font-bold text-tmt-navy mb-1">Articles Published Over Time</h2>
          <p className="text-xs text-gray-500 mb-4">{data.range.label}</p>
          {publishedChartData.length === 0 ? (
            <EmptyChart message="No articles published in this range." />
          ) : (
            <div className="h-56 -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={publishedChartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="period" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13 }} />
                  <Bar dataKey="Published" fill="#062F3D" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md p-5 sm:p-6">
          <h2 className="font-bold text-tmt-navy mb-1">Published Articles by Category</h2>
          <p className="text-xs text-gray-500 mb-4">{data.range.label} — share of articles published</p>
          {categoryDonutData.length === 0 ? (
            <EmptyChart message="No articles published in this range." />
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDonutData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="55%"
                    outerRadius="85%"
                    paddingAngle={2}
                  >
                    {categoryDonutData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ---------- All-time performance charts ---------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl shadow-md p-5 sm:p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-bold text-tmt-navy">Views by Category</h2>
            <span className="text-[10px] font-bold uppercase tracking-wide text-tmt-orange bg-tmt-orange/10 px-2 py-0.5 rounded-full">
              All-Time
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Total views have no date breakdown — this can&apos;t be filtered by range.
          </p>
          {viewsByCategoryData.length === 0 ? (
            <EmptyChart message="No published articles yet." />
          ) : (
            <div className="h-64 -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={viewsByCategoryData} layout="vertical" margin={{ top: 8, right: 20, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9ca3af" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#9ca3af" width={90} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13 }} />
                  <Bar dataKey="Views" fill="#FF7D00" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md p-5 sm:p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-bold text-tmt-navy">Top Performing Articles</h2>
            <span className="text-[10px] font-bold uppercase tracking-wide text-tmt-orange bg-tmt-orange/10 px-2 py-0.5 rounded-full">
              All-Time
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-4">By total views since publication.</p>
          {topArticlesData.length === 0 ? (
            <EmptyChart message="No published articles yet." />
          ) : (
            <div className="h-64 -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topArticlesData} layout="vertical" margin={{ top: 8, right: 20, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9ca3af" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="#9ca3af" width={110} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13 }} />
                  <Bar dataKey="Views" fill="#062F3D" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ---------- Daily visits table (kept for anyone who wants exact numbers) ---------- */}
      <div className="bg-white rounded-xl shadow-md p-5 sm:p-6">
        <h2 className="font-bold text-tmt-navy mb-4">Daily Visits — Detail</h2>
        {data.visitsOverTime.length === 0 ? (
          <p className="text-sm text-gray-500">No visits recorded yet.</p>
        ) : (
          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-2 font-semibold">Date</th>
                  <th className="pb-2 font-semibold text-right">Visitors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...data.visitsOverTime].reverse().map((v) => (
                  <tr key={v.date}>
                    <td className="py-2 text-gray-700 whitespace-nowrap">{v.date}</td>
                    <td className="py-2 text-right font-semibold text-tmt-navy">{v.visitors}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-40 flex items-center justify-center text-sm text-gray-400 text-center px-4">
      {message}
    </div>
  );
}
