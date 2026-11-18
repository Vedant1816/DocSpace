import { motion } from "motion/react";
import { dur, easeOut } from "../ui";

/**
 * Ranked horizontal bars: label, bar, value. Single series, one color.
 * Bars grow with scaleX (transform only).
 */
export default function BarChart({ data, colors }) {
  const color = colors?.[0] || "var(--color-primary)";

  if (!data || data.length === 0) {
    return <p className="flex h-48 items-center justify-center text-sm text-gray-400">No data yet</p>;
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <ul className="w-full space-y-3">
      {data.map((d, i) => (
        <li key={d.label} className="grid grid-cols-[minmax(0,8rem)_1fr_auto] items-center gap-3 text-sm" title={`${d.label}: ${d.value}`}>
          <span className="truncate text-gray-700">{d.label}</span>
          <span className="h-3 overflow-hidden rounded-r-[4px] bg-gray-100">
            <motion.span
              className="block h-full origin-left rounded-r-[4px]"
              style={{ width: `${(d.value / maxValue) * 100}%`, backgroundColor: color }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: dur.slow, ease: easeOut, delay: i * 0.04 }}
            />
          </span>
          <span className="font-medium tabular-nums text-gray-900">{d.value}</span>
        </li>
      ))}
    </ul>
  );
}
