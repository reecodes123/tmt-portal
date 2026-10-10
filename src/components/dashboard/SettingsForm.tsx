"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Save } from "lucide-react";
import { updateSettings } from "@/lib/api-client";
import type { WebsiteSettings } from "@/types/domain";

interface Props {
  initialSettings: WebsiteSettings;
}

export function SettingsForm({ initialSettings }: Props) {
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const update = <K extends keyof WebsiteSettings>(
    key: K,
    value: WebsiteSettings[K]
  ) => setSettings((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await updateSettings(settings);
      setSuccess("Settings saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {success && <p className="text-sm text-green-600">{success}</p>}

      <Group title="Branding">
        <Text label="Site name" value={settings.siteName} onChange={(v) => update("siteName", v)} />
        <Text label="Tagline" value={settings.tagline} onChange={(v) => update("tagline", v)} />
        <Text
          label="Contact email"
          value={settings.contactEmail}
          onChange={(v) => update("contactEmail", v)}
        />
        <Text
          label="Academic year"
          value={settings.academicYear}
          onChange={(v) => update("academicYear", v)}
        />
      </Group>

      <Group title="Homepage hero">
        <Text label="Headline" value={settings.heroHeadline} onChange={(v) => update("heroHeadline", v)} />
        <Textarea
          label="Sub-headline"
          value={settings.heroSubheadline}
          onChange={(v) => update("heroSubheadline", v)}
        />
        <Textarea
          label="Announcement banner"
          value={settings.announcement ?? ""}
          onChange={(v) => update("announcement", v)}
          hint="Leave blank to hide the banner."
        />
      </Group>

      <Group title="Social">
        <Text label="Facebook" value={settings.socialFacebook} onChange={(v) => update("socialFacebook", v)} />
        <Text label="X" value={settings.socialX} onChange={(v) => update("socialX", v)} />
        <Text label="Instagram" value={settings.socialInstagram} onChange={(v) => update("socialInstagram", v)} />
        <Text label="YouTube" value={settings.socialYoutube} onChange={(v) => update("socialYoutube", v)} />
      </Group>

      <Group title="Footer">
        <Textarea label="Footer text" value={settings.footerText} onChange={(v) => update("footerText", v)} />
      </Group>

      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-tmt-orange hover:bg-tmt-orange-light text-white font-semibold transition-colors disabled:opacity-60"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        Save all settings
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

function Text({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
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
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
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
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}
