import { useState } from "react";
import { motion } from "motion/react";
import { cn, dur, easeOut } from "../ui";

/** Validated categorical order (dataviz validator, light surface). Coral leads. */
const SERIES = ["#E05252", "#2a78d6", "#1baf7a", "#eda100", "#8b5cf6", "#e87ba4"];

/**
 * Donut chart with a total in the middle and a legend that always shows
 * value + share, so identity never rests on color alone. Hovering a segment
 * or a legend row highlights the pair.
 */
export default function PieChart({ data, colors = SERIES, size = 200 }) {
  const [active, setActive] = useState(null);
  const total = (data || []).reduce((sum, item) => sum + item.value, 0);

  if (!data || data.length === 0 || total === 0) {
    return <p className="flex h-48 items-center justify-center text-sm text-gray-400">No data yet</p>;
  }

  const stroke = Math.max(14, size * 0.13);
  const r = size / 2 - stroke / 2 - 2;
  const C = 2 * Math.PI * r;
  const gap = data.length > 1 ? 2 : 0;
  const lens = data.map((item) => (item.value / total) * C);
  const segments = data.map((item, i) => ({
    ...item,
    color: colors[i % colors.length],
    len: Math.max(lens[i] - gap, 0.5),
    offset: lens.slice(0, i).reduce((a, b) => a + b, 0),
    pct: ((item.value / total) * 100).toFixed(0),
  }));

  const shown = active != null ? segments[active] : null;

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <motion.svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
          role="img"
          aria-label={segments.map((s) => `${s.label} ${s.value}`).join(", ")}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: dur.slow, ease: easeOut }}
        >
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-gray-100)" strokeWidth={stroke} />
          {segments.map((s, i) => (
            <circle
              key={s.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={`${s.len} ${C - s.len}`}
              strokeDashoffset={-s.offset}
              className="cursor-pointer transition-opacity duration-150"
              opacity={active == null || active === i ? 1 : 0.3}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
            >
              <title>{`${s.label}: ${s.value} (${s.pct}%)`}</title>
            </circle>
          ))}
        </motion.svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-display text-[30px] font-medium leading-none tabular-nums text-gray-900">{shown ? shown.value : total}</span>
          <span className="ds-label mt-1 max-w-[70%] truncate">{shown ? shown.label : "Total"}</span>
        </div>
      </div>

      <ul className="w-full min-w-0 divide-y divide-gray-200 border-y border-gray-200">
        {segments.map((s, i) => (
          <li
            key={s.label}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            className={cn("flex items-center gap-3 py-2 text-sm transition-colors duration-150", active === i && "bg-gray-50")}
          >
            <span className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: s.color }} aria-hidden />
            <span className="min-w-0 flex-1 truncate text-gray-700">{s.label}</span>
            <span className="font-medium tabular-nums text-gray-900">{s.value}</span>
            <span className="w-10 text-right font-mono text-[11px] tabular-nums text-gray-500">{s.pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
