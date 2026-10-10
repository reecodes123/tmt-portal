"use client";

import {
  X,
  ChevronRight,
  Home as HomeIcon,
  Award,
  Info,
  FileText,
  Mail,
  Bookmark,
  MessageSquarePlus,
  Facebook,
  Instagram,
  Youtube,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { XIcon } from "./XIcon";
import { FeedbackWidget } from "./FeedbackWidget";
import { TIER_LABELS, tierAnchorId } from "@/types/domain";
import type { BoardTier, Category, WebsiteSettings } from "@/types/domain";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: WebsiteSettings;
  /** Read from the Category table instead of a hardcoded list — see Navigation.tsx. */
  categories: Category[];
}

export function SettingsPanel({ isOpen, onClose, settings, categories }: SettingsPanelProps) {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  // Each staff role deep-links to its own section on the Editorial Board
  // page. Labels come from TIER_LABELS so they can never drift from what the
  // public org chart and the dashboard's tier picker actually show.
  const staffRoles: BoardTier[] = [
    "news-writer",
    "feature-writer",
    "sports-writer",
    "copyreader",
    "literary-writer",
    "cartoonist",
    "photojournalist",
    "creatives",
    "media",
    "broadcast",
  ];

  const socialMedia = [
    { name: "Facebook", url: settings.socialFacebook, icon: Facebook },
    { name: "Instagram", url: settings.socialInstagram, icon: Instagram },
    { name: "X", url: settings.socialX, icon: XIcon },
    { name: "YouTube", url: settings.socialYoutube, icon: Youtube },
  ].filter((social) => social.url.trim().length > 0);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 overflow-y-auto animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-tmt-navy text-white p-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/60"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-5 sm:p-6">
          {/* Home */}
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center justify-between p-3 mb-3 rounded-lg bg-tmt-orange/10 hover:bg-tmt-orange/20 transition-colors group"
          >
            <span className="flex items-center gap-3 font-semibold text-tmt-navy">
              <HomeIcon size={18} className="text-tmt-orange" />
              Home
            </span>
            <ChevronRight size={18} className="text-tmt-orange" />
          </Link>

          {/* Bookmarks */}
          <Link
            href="/bookmarks"
            onClick={onClose}
            className="flex items-center justify-between p-3 mb-6 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <span className="flex items-center gap-3 font-semibold text-gray-700 group-hover:text-tmt-navy">
              <Bookmark size={18} className="text-tmt-orange" />
              Bookmarks
            </span>
            <ChevronRight size={18} className="text-gray-400 group-hover:text-tmt-orange" />
          </Link>

          {/* Search Section */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-tmt-navy mb-3">Search</h3>
            <input
              type="text"
              placeholder="Search articles..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-tmt-orange focus:outline-none transition-colors"
            />
          </div>

          {/* Categories */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-tmt-navy mb-3">Categories</h3>
            <div className="space-y-2">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/${category.slug}`}
                  onClick={onClose}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-tmt-orange/10 transition-colors group"
                >
                  <span className="font-medium text-gray-700 group-hover:text-tmt-orange">
                    {category.name}
                  </span>
                  <ChevronRight
                    size={18}
                    className="text-gray-400 group-hover:text-tmt-orange"
                  />
                </Link>
              ))}
            </div>
          </div>

          {/* Editorial Board & Staff */}
          <div className="mb-8">
            <Link
              href="/editor-in-chief"
              onClick={onClose}
              className="flex items-center justify-between mb-3 group"
            >
              <h3 className="text-lg font-bold text-tmt-navy group-hover:text-tmt-orange transition-colors">
                Editorial Board &amp; Staff
              </h3>
              <ChevronRight size={18} className="text-gray-400 group-hover:text-tmt-orange" />
            </Link>
            <div className="space-y-2">
              {staffRoles.map((tier) => (
                <Link
                  key={tier}
                  href={`/editor-in-chief#${tierAnchorId(tier)}`}
                  onClick={onClose}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <span className="text-sm text-gray-600 group-hover:text-tmt-navy">
                    {TIER_LABELS[tier]}
                  </span>
                  <ChevronRight
                    size={16}
                    className="text-gray-400 group-hover:text-tmt-orange"
                  />
                </Link>
              ))}
            </div>
          </div>

          {/* Editor-in-Chief */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-tmt-navy mb-3">About</h3>
            <div className="space-y-2">
              <Link
                href="/editor-in-chief"
                onClick={onClose}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <span className="flex items-center gap-3 font-medium text-gray-700 group-hover:text-tmt-navy">
                  <Award size={18} className="text-tmt-orange" />
                  Editor-in-Chief
                </span>
                <ChevronRight size={16} className="text-gray-400 group-hover:text-tmt-orange" />
              </Link>
              <Link
                href="/about"
                onClick={onClose}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <span className="flex items-center gap-3 font-medium text-gray-700 group-hover:text-tmt-navy">
                  <Info size={18} className="text-tmt-orange" />
                  About The Matrix Today
                </span>
                <ChevronRight size={16} className="text-gray-400 group-hover:text-tmt-orange" />
              </Link>
            </div>
          </div>

          {/* Contact Us */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-tmt-navy mb-3">Contact Us</h3>
            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="flex items-center justify-center gap-2 w-full p-3 mb-3 text-center rounded-lg border-2 border-tmt-orange text-tmt-orange hover:bg-tmt-orange hover:text-white font-medium transition-colors"
            >
              <MessageSquarePlus size={16} />
              Send Feedback
            </button>
            <div className="grid grid-cols-2 gap-3 mb-3">
              {socialMedia.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 p-3 text-center rounded-lg bg-tmt-orange hover:bg-tmt-orange-light text-white font-medium transition-colors"
                >
                  <social.icon size={16} />
                  {social.name}
                </a>
              ))}
            </div>
            <a
              href={`mailto:${settings.contactEmail}`}
              className="flex items-center justify-center gap-2 p-3 text-center rounded-lg bg-tmt-navy hover:bg-tmt-navy-light text-white font-medium transition-colors"
            >
              <Mail size={16} />
              Email Us
            </a>
          </div>

          {/* Legal */}
          <div className="mb-4">
            <h3 className="text-lg font-bold text-tmt-navy mb-3">Legal</h3>
            <Link
              href="/terms"
              onClick={onClose}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 text-gray-600 hover:text-tmt-navy transition-colors group"
            >
              <span className="flex items-center gap-3">
                <FileText size={18} className="text-tmt-orange" />
                Terms and Conditions
              </span>
              <ChevronRight size={16} className="text-gray-400 group-hover:text-tmt-orange" />
            </Link>
          </div>
        </div>
      </div>

      <FeedbackWidget isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
    </>
  );
}
