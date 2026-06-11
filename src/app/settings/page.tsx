"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Chrome } from "@/shared/layout/Chrome";
import { useProgress } from "@/shared/progress/useProgress";
import { useAudience } from "@/shared/audience/useAudience";
import { ENTRY_TOPIC, EXPERIENCE_OPTIONS, GOAL_OPTIONS, REGISTER_OPTIONS, personalizationFor } from "@/shared/audience/policy";
import { listAllTopics } from "@/categories/registry";
import type { Experience, Goal, Register } from "@/shared/audience/types";

type ThemeChoice = "system" | "light" | "dark";
type MotionChoice = "system" | "reduce";

export default function SettingsPage() {
  const { state, updateSettings, resetProgress, exportJson, importJson } = useProgress();
  const { profile, onboarded, saveProfile } = useAudience();
  const theme: ThemeChoice = state?.settings.theme ?? "system";
  const motion: MotionChoice = state?.settings.reduceMotion ?? "system";
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const flash = (m: string) => {
    setMsg(m);
    window.setTimeout(() => setMsg(null), 2400);
  };

  const download = () => {
    const blob = new Blob([exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "groundwork-progress.json";
    a.click();
    URL.revokeObjectURL(url);
    flash("Progress exported.");
  };

  const onImportFile = async (file: File) => {
    try {
      importJson(await file.text());
      flash("Progress imported.");
    } catch {
      flash("Couldn't import that file.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Chrome breadcrumb={[{ label: "Settings" }]} />
      <main id="main-content" className="flex-1 max-w-2xl mx-auto px-5 md:px-8 py-16 w-full">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)] mb-1">
          preferences
        </div>
        <h1 className="text-4xl font-semibold text-[var(--text)] mb-10">Settings</h1>

        <Section
          title="Your path"
          hint="Where you start, how lessons are explained, and what your path is optimized for — the same answers as the get-started questions."
        >
          {onboarded && profile ? (
            <div className="flex flex-col gap-4">
              <LabeledControl label="Experience" effect={experienceEffect(profile.experience)}>
                <SegmentedControl<Experience>
                  value={profile.experience}
                  options={EXPERIENCE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                  onChange={(v) => saveProfile({ ...profile, experience: v })}
                />
              </LabeledControl>
              <LabeledControl label="Explanation style" effect={REGISTER_OPTIONS.find((o) => o.value === profile.register)?.effect}>
                <SegmentedControl<Register>
                  value={profile.register}
                  options={REGISTER_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                  onChange={(v) => saveProfile({ ...profile, register: v })}
                />
              </LabeledControl>
              <LabeledControl label="Goal" effect={GOAL_OPTIONS.find((o) => o.value === profile.goal)?.effect}>
                <SegmentedControl<Goal>
                  value={profile.goal}
                  options={GOAL_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                  onChange={(v) => saveProfile({ ...profile, goal: v })}
                />
              </LabeledControl>
              <Link href="/start" className="self-start font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text)]">
                retake the questions →
              </Link>
            </div>
          ) : (
            <Link
              href="/start"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--accent-line)] bg-[var(--accent-soft)] px-4 py-2.5 text-sm font-medium text-[var(--accent-ink)] hover:bg-[var(--bg-inset)] transition-colors"
            >
              Answer three quick questions to set up your path &rarr;
            </Link>
          )}
        </Section>

        <Section title="Appearance" hint="Dark is the default. Light works everywhere; System follows your device.">
          <SegmentedControl<ThemeChoice>
            value={theme}
            options={[
              { value: "system", label: "System" },
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
            ]}
            onChange={(v) => updateSettings((s) => ({ ...s, theme: v }))}
          />
        </Section>

        <Section title="Motion" hint="Reduce motion turns off animations app-wide. System honors your device's reduce-motion setting.">
          <SegmentedControl<MotionChoice>
            value={motion}
            options={[
              { value: "system", label: "System" },
              { value: "reduce", label: "Reduce motion" },
            ]}
            onChange={(v) => updateSettings((s) => ({ ...s, reduceMotion: v }))}
          />
        </Section>

        <Section title="Code language" hint="Solutions are written in Python. More languages may come later.">
          <SegmentedControl<"python">
            value="python"
            options={[{ value: "python", label: "Python" }]}
            onChange={() => {}}
          />
        </Section>

        <Section title="Your progress" hint="Progress lives only in this browser. Export to back it up or move devices.">
          <div className="flex flex-wrap gap-2">
            <button onClick={download} className={btn}>
              Export (.json)
            </button>
            <button onClick={() => fileRef.current?.click()} className={btn}>
              Import
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onImportFile(f);
                e.target.value = "";
              }}
            />
            <button
              onClick={() => {
                if (window.confirm("Reset all progress? This can't be undone.")) {
                  resetProgress();
                  flash("Progress reset.");
                }
              }}
              className="min-h-[40px] px-4 py-2 rounded-lg font-mono text-xs border border-[color-mix(in_oklab,var(--diff-hard)_50%,transparent)] text-[var(--diff-hard)] hover:bg-[color-mix(in_oklab,var(--diff-hard)_10%,transparent)]"
            >
              Reset progress
            </button>
          </div>
          {msg && <p className="mt-3 text-xs font-mono text-[var(--accent-ink)]">{msg}</p>}
        </Section>
      </main>
    </div>
  );
}

const btn =
  "min-h-[40px] px-4 py-2 rounded-lg font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:border-[var(--line-strong)] hover:text-[var(--text)] transition-colors";

/** The consequence of the current Experience choice, computed live from the
 *  registry (entry name + hidden/visible counts) so it never drifts. */
function experienceEffect(experience: Experience): string {
  const topics = listAllTopics();
  const entry = ENTRY_TOPIC[experience];
  const entryName = topics.find((t) => t.key === entry.topic)?.name ?? entry.topic;
  const hidden = personalizationFor(experience, topics).assumedKeys.size;
  return hidden === 0
    ? `You start at ${entryName}, with the full ${topics.length}-topic map.`
    : `You start at ${entryName} — ${hidden} known topics tucked away (${topics.length - hidden} on your map).`;
}

function LabeledControl({ label, effect, children }: { label: string; effect?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-faint)] mb-1.5">{label}</div>
      {children}
      {effect && (
        <div className="mt-1 text-[12px] leading-snug text-[var(--accent-ink)]">
          <span aria-hidden="true">→ </span>
          {effect}
        </div>
      )}
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="mb-10 pb-8 border-b border-[var(--line-faint)] last:border-b-0">
      <h2 className="text-lg font-semibold text-[var(--text)] mb-1">{title}</h2>
      <p className="text-sm text-[var(--text-muted)] mb-4 max-w-xl">{hint}</p>
      {children}
    </section>
  );
}

function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-[var(--line)] bg-[var(--bg-card)] p-1 gap-1 flex-wrap">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`min-h-[36px] px-4 py-1.5 rounded-md text-xs font-mono transition-colors ${
              active
                ? "bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--accent-ink)]"
                : "text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
