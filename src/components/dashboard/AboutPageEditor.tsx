"use client";

import { useState, type FormEvent } from "react";
import {
  ChevronDown,
  ChevronUp,
  ImagePlus,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { updateAboutPage, uploadMedia } from "@/lib/api-client";
import { RichTextEditor } from "@/components/shared/RichTextEditor";
import { ICON_KEYS, resolveIcon } from "@/lib/icons";
import type { AboutPage, Achievement, MissionPillar } from "@/types/domain";

interface Props {
  initialPage: AboutPage;
}

/**
 * About Us editor. Structured fields for the two genuine repeating lists
 * (mission pillars, achievements); everything else — hero copy, the
 * narrative body — is plain fields plus the same RichTextEditor used for
 * Article.content. Not a generic content-builder.
 */
export function AboutPageEditor({ initialPage }: Props) {
  const [page, setPage] = useState(initialPage);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const update = <K extends keyof AboutPage>(key: K, value: AboutPage[K]) =>
    setPage((prev) => ({ ...prev, [key]: value }));

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const asset = await uploadMedia(file);
      update("heroImageUrl", asset.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const saved = await updateAboutPage(page);
      setPage(saved);
      setSuccess("About Us page saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {success && <p className="text-sm text-green-600">{success}</p>}

      <Group title="Hero">
        <Text
          label="Eyebrow"
          value={page.heroEyebrow ?? ""}
          onChange={(v) => update("heroEyebrow", v || null)}
        />
        <Text
          label="Title"
          value={page.heroTitle}
          onChange={(v) => update("heroTitle", v)}
        />
        <Textarea
          label="Subtitle"
          value={page.heroSubtitle ?? ""}
          onChange={(v) => update("heroSubtitle", v || null)}
        />
        <div>
          <label className="block text-sm font-semibold text-tmt-navy mb-1.5">
            Hero image
          </label>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            {page.heroImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={page.heroImageUrl}
                alt=""
                className="w-32 h-20 object-cover rounded-lg shrink-0"
              />
            ) : (
              <div className="w-32 h-20 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 shrink-0">
                <ImagePlus size={22} />
              </div>
            )}
            <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-semibold text-gray-700 transition-colors">
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
              />
              {uploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Uploading…
                </>
              ) : (
                <>
                  <ImagePlus size={16} />{" "}
                  {page.heroImageUrl ? "Change image" : "Upload image"}
                </>
              )}
            </label>
          </div>
        </div>
      </Group>

      <Group title="Overview">
        <RichTextEditor
          value={page.overview}
          onChange={(v) => update("overview", v)}
          placeholder="Tell readers about the organization…"
        />
      </Group>

      <Group title="Mission pillars">
        <PillarList
          pillars={page.missionPillars}
          onChange={(v) => update("missionPillars", v)}
        />
      </Group>

      <Group title="Achievements">
        <AchievementList
          achievements={page.achievements}
          onChange={(v) => update("achievements", v)}
        />
      </Group>

      <button
        type="submit"
        disabled={saving || uploading}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-tmt-orange hover:bg-tmt-orange-light text-white font-semibold transition-colors disabled:opacity-60"
      >
        {saving ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Save size={16} />
        )}
        Save About Us page
      </button>
    </form>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-5 sm:p-6 space-y-4">
      <h2 className="font-bold text-tmt-navy">{title}</h2>
      {children}
    </div>
  );
}

function Text({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-tmt-navy mb-1.5">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-tmt-orange focus:outline-none"
      />
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-tmt-navy mb-1.5">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-tmt-orange focus:outline-none resize-y"
      />
    </div>
  );
}

function IconSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2 border-2 border-gray-200 rounded-lg bg-white focus:border-tmt-orange focus:outline-none"
    >
      {ICON_KEYS.map((key) => (
        <option key={key} value={key}>
          {key}
        </option>
      ))}
    </select>
  );
}

function PillarList({
  pillars,
  onChange,
}: {
  pillars: MissionPillar[];
  onChange: (v: MissionPillar[]) => void;
}) {
  const update = (i: number, patch: Partial<MissionPillar>) =>
    onChange(pillars.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  const remove = (i: number) => onChange(pillars.filter((_, idx) => idx !== i));
  const add = () => {
    if (pillars.length >= 6) return;
    onChange([...pillars, { icon: ICON_KEYS[0], label: "", description: "" }]);
  };

  return (
    <div className="space-y-3">
      {pillars.map((pillar, i) => {
        const Icon = resolveIcon(pillar.icon);
        return (
          <div
            key={i}
            className="flex items-start gap-3 border border-gray-200 rounded-lg p-3"
          >
            <Icon size={18} className="text-tmt-orange mt-2 shrink-0" />
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-2 items-start">
              <IconSelect
                value={pillar.icon}
                onChange={(v) => update(i, { icon: v })}
              />
              <input
                value={pillar.label}
                onChange={(e) => update(i, { label: e.target.value })}
                placeholder="Label (e.g. The Eyes)"
                className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-tmt-orange focus:outline-none"
              />
              <textarea
                value={pillar.description}
                onChange={(e) => update(i, { description: e.target.value })}
                placeholder="Description"
                rows={2}
                className="sm:col-span-2 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-tmt-orange focus:outline-none resize-y"
              />
            </div>
            <button
              type="button"
              onClick={() => remove(i)}
              className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 shrink-0"
              aria-label="Remove pillar"
            >
              <Trash2 size={16} />
            </button>
          </div>
        );
      })}
      {pillars.length < 6 && (
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-2 text-sm font-semibold text-tmt-orange hover:text-tmt-orange-light"
        >
          <Plus size={16} /> Add pillar
        </button>
      )}
    </div>
  );
}

function AchievementList({
  achievements,
  onChange,
}: {
  achievements: Achievement[];
  onChange: (v: Achievement[]) => void;
}) {
  const update = (i: number, patch: Partial<Achievement>) =>
    onChange(achievements.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  const remove = (i: number) =>
    onChange(achievements.filter((_, idx) => idx !== i));
  const move = (i: number, direction: -1 | 1) => {
    const target = i + direction;
    if (target < 0 || target >= achievements.length) return;
    const next = achievements.slice();
    [next[i], next[target]] = [next[target], next[i]];
    onChange(next);
  };
  const add = () => {
    onChange([
      ...achievements,
      { year: String(new Date().getFullYear()), icon: ICON_KEYS[0], title: "", description: "" },
    ]);
  };

  return (
    <div className="space-y-3">
      {achievements.map((achievement, i) => {
        const Icon = resolveIcon(achievement.icon);
        return (
          <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Icon size={18} className="text-tmt-orange shrink-0" />
              <input
                value={achievement.year}
                onChange={(e) => update(i, { year: e.target.value })}
                placeholder="Year"
                className="w-20 shrink-0 px-2 py-1.5 border-2 border-gray-200 rounded-lg text-sm focus:border-tmt-orange focus:outline-none"
              />
              <IconSelect
                value={achievement.icon}
                onChange={(v) => update(i, { icon: v })}
              />
              <div className="ml-auto flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30"
                  aria-label="Move up"
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === achievements.length - 1}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30"
                  aria-label="Move down"
                >
                  <ChevronDown size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600"
                  aria-label="Remove achievement"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <input
              value={achievement.title}
              onChange={(e) => update(i, { title: e.target.value })}
              placeholder="Title"
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-tmt-orange focus:outline-none"
            />
            <textarea
              value={achievement.description}
              onChange={(e) => update(i, { description: e.target.value })}
              placeholder="Description"
              rows={2}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-tmt-orange focus:outline-none resize-y"
            />
          </div>
        );
      })}
      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-2 text-sm font-semibold text-tmt-orange hover:text-tmt-orange-light"
      >
        <Plus size={16} /> Add achievement
      </button>
    </div>
  );
}
