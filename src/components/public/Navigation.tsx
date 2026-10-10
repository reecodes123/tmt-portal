"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Menu as MenuIcon, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { SettingsPanel } from "./SettingsPanel";
import type { Category, WebsiteSettings } from "@/types/domain";

const logo = "/images/logo.png";

interface Props {
  settings: WebsiteSettings;
  /** Read from the Category table (via the layout) instead of a hardcoded
   *  list, so a category added from the dashboard gets a nav entry without
   *  a code deploy. */
  categories: Category[];
}

/**
 * Primary site navigation.
 *
 * Migrated from react-router's <NavLink> (whose `className` render-prop
 * receives `{ isActive }`) to next/link, which has no such prop. Active state
 * now comes from usePathname(). The search box, which was inert in the
 * prototype, now routes to /search.
 */
export function Navigation({ settings, categories }: Props) {
  const navItems = categories.map((c) => ({ name: c.name, path: `/${c.slug}` }));
  const pathname = usePathname();
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const linkClass = (path: string, mobile = false) => {
    const isActive = pathname === path;
    const base = mobile
      ? "block px-4 py-3 rounded-md text-sm font-medium transition-all duration-300 mb-1"
      : "px-4 py-2 rounded-md text-sm font-medium transition-all duration-300";
    const state = isActive
      ? "bg-tmt-orange text-white shadow-lg"
      : "text-white hover:bg-tmt-orange-light hover:text-white";
    return `${base} ${state}`;
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-tmt-navy shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/"
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={settings.logoUrl ?? logo}
                alt={settings.siteName}
                className="w-10 h-10 object-contain"
              />
              <span className="text-white font-bold text-lg hidden sm:block">
                {settings.siteName}
              </span>
            </Link>

            <div className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={linkClass(item.path)}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Toggle mobile menu"
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X size={20} /> : <MenuIcon size={20} />}
              </button>

              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Toggle search"
                aria-expanded={isSearchOpen}
              >
                {isSearchOpen ? <X size={20} /> : <Search size={20} />}
              </button>

              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors group"
                aria-label="Open menu"
              >
                <div className="flex flex-col gap-1">
                  <div className="w-5 h-0.5 bg-white transition-all group-hover:bg-tmt-orange" />
                  <div className="w-5 h-0.5 bg-white transition-all group-hover:bg-tmt-orange" />
                  <div className="w-5 h-0.5 bg-white transition-all group-hover:bg-tmt-orange" />
                </div>
              </button>
            </div>
          </div>

          {isMobileMenuOpen && (
            <div className="lg:hidden pb-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={linkClass(item.path, true)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          )}

          {isSearchOpen && (
            <div className="pb-4">
              <form onSubmit={handleSearch} className="relative">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles, topics, authors…"
                  aria-label="Search articles"
                  className="w-full pl-11 pr-4 py-3 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-tmt-orange"
                />
              </form>
            </div>
          )}
        </div>
      </nav>

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        categories={categories}
      />
    </>
  );
}
