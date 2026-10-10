"use client";

import { Search } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

/**
 * Footer search band.
 *
 * The prototype's version only console.logged the query. It now routes to
 * /search, which is one of the functional requirements the prototypes left
 * unimplemented.
 */
export function BottomSearch() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    setSearchQuery("");
  };

  return (
    <div className="bg-gradient-to-r from-tmt-orange to-tmt-orange-light py-8 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-white text-xl sm:text-2xl font-bold text-center mb-4">
          Looking for something specific?
        </h2>
        <form onSubmit={handleSearch} className="relative">
          <label htmlFor="footer-search" className="sr-only">
            Search The Matrix Today
          </label>
          <input
            id="footer-search"
            type="search"
            placeholder="Search The Matrix Today..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-6 py-4 pr-14 rounded-full text-gray-700 text-lg focus:outline-none focus:ring-4 focus:ring-white/50 shadow-lg"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-tmt-navy hover:bg-tmt-navy-light text-white rounded-full transition-colors shadow-md"
            aria-label="Search"
          >
            <Search size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
