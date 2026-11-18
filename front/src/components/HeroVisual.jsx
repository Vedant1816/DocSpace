import { motion } from "motion/react";
import { Avatar, Icon, dur, easeOut } from "../ui";

/*
 * Hero visuals: product "spec sheets" built from the design system instead of
 * stock illustration. Decorative sample content, hidden from assistive tech.
 */

const rise = (delay) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: dur.slow, ease: easeOut, delay },
});

/* One heartbeat, drawn once. */
function Trace({ className }) {
  return (
    <svg viewBox="0 0 320 60" className={className} fill="none" preserveAspectRatio="none" aria-hidden>
      <motion.path
        d="M0 34 H96 L108 34 L116 18 L124 50 L134 6 L146 54 L156 34 H208 L218 26 L228 34 H320"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: dur.slow * 2, ease: easeOut, delay: 0.3 }}
      />
    </svg>
  );
}

function Frame({ code, label, children }) {
  return (
    <div className="relative" aria-hidden>
      <div className="grid-bg absolute -inset-6 -z-10 border border-gray-200" />
      <div className="mb-2 flex items-baseline justify-between">
        <span className="ds-label !text-gray-900">{label}</span>
        <span className="ds-label">{code}</span>
      </div>
      {children}
    </div>
  );
}

function CheckRow({ k, v, delay }) {
  return (
    <motion.div {...rise(delay)} className="flex items-center gap-3 bg-white px-4 py-3">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600">
        <Icon name="check" className="text-[16px]" />
      </span>
      <span className="ds-label flex-1">{k}</span>
      <span className="text-sm font-medium text-gray-900">{v}</span>
    </motion.div>
  );
}

/** Doctor home: a verified credential card. */
export function DoctorVisual() {
  return (
    <Frame label="Credential" code="Sample · DS-0427">
      <div className="ds-card overflow-hidden shadow-[0_34px_70px_-30px_rgb(22_24_28/0.35)]">
        <motion.div {...rise(0.1)} className="flex items-center gap-4 border-b border-gray-200 p-5">
          <Avatar name="Asha Mehra" size={52} />
          <div className="min-w-0 flex-1">
            <p className="font-display text-xl font-medium uppercase tracking-tight text-gray-900">Dr. Asha Mehra</p>
            <p className="ds-label mt-0.5">Cardiology · 8 yrs</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-emerald-700">
            <Icon name="verified" fill className="text-[14px]" /> Verified
          </span>
        </motion.div>

        <div className="bg-gray-50 px-5 pb-2 pt-4 text-primary">
          <div className="mb-1 flex justify-between">
            <span className="ds-label">Profile signal</span>
            <span className="ds-label tabular-nums">72 bpm</span>
          </div>
          <Trace className="h-14 w-full" />
        </div>

        <div className="grid gap-px border-t border-gray-200 bg-[var(--color-line-soft)]">
          <CheckRow k="Medical register" v="Matched" delay={0.2} />
          <CheckRow k="Degree" v="MBBS, MD" delay={0.25} />
          <CheckRow k="License" v="Active" delay={0.3} />
        </div>
      </div>

      <motion.div
        {...rise(0.4)}
        className="relative mt-4 flex w-fit items-center gap-3 border border-gray-900 bg-white px-4 py-2.5 shadow-[var(--shadow-hard)]"
      >
        <Icon name="bolt" className="text-primary" />
        <span className="font-display text-lg font-medium text-gray-900">2m 14s</span>
        <span className="ds-label">to verify</span>
      </motion.div>
    </Frame>
  );
}

const STAGES = [
  { k: "Applied", v: 24 },
  { k: "Shortlisted", v: 9 },
  { k: "Interview", v: 4 },
  { k: "Hired", v: 1 },
];

const CANDIDATES = [
  { n: "Rahul Verma", s: "MD · Cardiology", st: "Interview", tone: "text-amber-800 bg-amber-50" },
  { n: "Neha Kapoor", s: "DM · Cardiology", st: "Shortlisted", tone: "text-emerald-700 bg-emerald-50" },
  { n: "Imran Shaikh", s: "MD · Medicine", st: "Applied", tone: "text-gray-700 bg-gray-100" },
];

/** Hospital home: a hiring pipeline for one opening. */
export function HospitalVisual() {
  return (
    <Frame label="Opening" code="Sample · JOB-118">
      <div className="ds-card overflow-hidden shadow-[0_34px_70px_-30px_rgb(22_24_28/0.35)]">
        <motion.div {...rise(0.1)} className="flex items-start justify-between gap-4 border-b border-gray-200 p-5">
          <div className="min-w-0">
            <p className="font-display text-xl font-medium uppercase tracking-tight text-gray-900">Consultant cardiologist</p>
            <p className="ds-label mt-0.5">Full-time · Cardiology</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded bg-emerald-50 px-2 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-emerald-700">
            <i className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Open
          </span>
        </motion.div>

        <div className="space-y-3 bg-gray-50 p-5">
          {STAGES.map((s, i) => (
            <div key={s.k} className="grid grid-cols-[6.5rem_1fr_2rem] items-center gap-3">
              <span className="ds-label">{s.k}</span>
              <span className="h-2.5 overflow-hidden rounded-r-[4px] bg-gray-200/70">
                <motion.span
                  className="block h-full origin-left rounded-r-[4px] bg-primary"
                  style={{ width: `${(s.v / STAGES[0].v) * 100}%`, minWidth: 4 }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: dur.slow, ease: easeOut, delay: 0.2 + i * 0.05 }}
                />
              </span>
              <span className="text-right text-sm font-medium tabular-nums text-gray-900">{s.v}</span>
            </div>
          ))}
        </div>

        <div className="divide-y divide-gray-200 border-t border-gray-200">
          {CANDIDATES.map((c, i) => (
            <motion.div key={c.n} {...rise(0.35 + i * 0.05)} className="flex items-center gap-3 px-5 py-3">
              <Avatar name={c.n} size={32} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">{c.n}</p>
                <p className="ds-label truncate !text-[10px]">{c.s}</p>
              </div>
              <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.1em] ${c.tone}`}>{c.st}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div
        {...rise(0.5)}
        className="relative ml-auto mt-4 flex w-fit items-center gap-3 border border-gray-900 bg-white px-4 py-2.5 shadow-[var(--shadow-hard)]"
      >
        <Icon name="psychology" className="text-primary" />
        <span className="font-display text-lg font-medium text-gray-900">99%</span>
        <span className="ds-label">AI verification</span>
      </motion.div>
    </Frame>
  );
}
