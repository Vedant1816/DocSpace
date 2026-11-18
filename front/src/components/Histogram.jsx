import { useState } from "react";
import { motion } from "motion/react";
import { dur, easeOut } from "../ui";

/**
 * Column chart for counts over time. One series, one color.
 * Bars grow from the baseline with scaleY (transform only), have 4px rounded
 * tops and a 2px gap, and show a tooltip on hover or keyboard focus.
 * `colors` is accepted for API compatibility; only the first color is used.
 */
export default function Histogram({ data, colors, height = 200 }) {
  const [hover, setHover] = useState(null);
  const color = colors?.[0] || "var(--color-primary)";

  if (!data || data.length === 0) {
    return <p className="flex h-48 items-center justify-center text-sm text-gray-400">No data yet</p>;
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const ticks = maxValue >= 4 ? [maxValue, Math.round(maxValue / 2), 0] : [maxValue, 0];
  const multiYear = new Set(data.map((d) => d.sortKey?.slice(0, 4))).size > 1;
  const short = (d) => {
    const m = d.label.slice(0, 3);
    return multiYear && d.sortKey?.endsWith("-01") ? `${m} ’${d.sortKey.slice(2, 4)}` : m;
  };

  return (
    <div className="w-full overflow-x-auto no-scrollbar">
      <div className="relative pt-2" style={{ minWidth: data.length * 30 + 40 }}>
        <div className="relative ml-9" style={{ height }}>
          {/* recessive grid */}
          {ticks.map((t, i) => (
            <div key={i} className="absolute inset-x-0 border-t border-gray-200" style={{ top: `${(i / (ticks.length - 1)) * 100}%` }}>
              <span className="absolute -left-9 -top-2 w-7 text-right font-mono text-[10px] tabular-nums text-gray-400">{t}</span>
            </div>
          ))}

          <div className="absolute inset-0 flex items-end gap-[2px]">
            {data.map((d, i) => (
              <button
                key={d.sortKey || i}
                type="button"
                className="group relative flex h-full flex-1 items-end focus-visible:outline-offset-0"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                aria-label={`${d.label}${d.sortKey ? " " + d.sortKey.slice(0, 4) : ""}: ${d.value}`}
              >
                <motion.span
                  className="block w-full origin-bottom rounded-t-[4px]"
                  style={{ height: `${(d.value / maxValue) * 100}%`, minHeight: d.value > 0 ? 2 : 0, backgroundColor: color, opacity: hover == null || hover === i ? 1 : 0.45 }}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: dur.slow, ease: easeOut, delay: Math.min(i * 0.01, 0.2) }}
                />
                {hover === i && (
                  <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-[6px] border border-gray-900 bg-white px-2 py-1 text-xs shadow-[var(--shadow-hard)]">
                    <b className="tabular-nums text-gray-900">{d.value}</b>
                    <span className="ml-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-gray-500">
                      {d.label.slice(0, 3)} {d.sortKey?.slice(0, 4)}
                    </span>
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="ml-9 mt-2 flex gap-[2px]">
          {data.map((d, i) => (
            <span key={d.sortKey || i} className="flex-1 truncate text-center font-mono text-[10px] uppercase tracking-[0.06em] text-gray-500">
              {short(d)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
