/** Decorative book shapes, not publisher covers or user library data. */
export default function BookArt({ variant = 0 }: { variant?: number }) {
  const colors = [["#58796e", "#b9c9b0", "#f1d8b3"], ["#a67869", "#ddc4b1", "#718c81"], ["#6b8098", "#bacbda", "#e5c890"], ["#7e7895", "#c3bdd5", "#c6d7c0"]][variant % 4];
  return <svg viewBox="0 0 180 140" fill="none" aria-hidden="true" className="book-art">
    <ellipse cx="93" cy="124" rx="71" ry="8" fill="#24392d" opacity=".07" />
    <g transform="rotate(-12 60 120)"><rect x="22" y="28" width="59" height="92" rx="3" fill={colors[0]} /><path d="M29 30v88" stroke="white" strokeOpacity=".2" /><path d="M39 48h24M39 55h16" stroke="white" strokeOpacity=".7" strokeWidth="2" /><circle cx="53" cy="86" r="13" stroke="white" strokeOpacity=".3" /></g>
    <g transform="rotate(10 120 120)"><rect x="88" y="15" width="65" height="105" rx="3" fill={colors[1]} /><path d="M94 18v99" stroke="#24392d" strokeOpacity=".13" /><rect x="106" y="34" width="28" height="35" rx="14" fill={colors[0]} opacity=".5" /><path d="M107 88h27M111 94h19" stroke="#24392d" strokeOpacity=".4" /></g>
    <rect x="53" y="105" width="93" height="18" rx="3" fill={colors[2]} /><path d="M65 111h77M65 116h77" stroke="white" strokeOpacity=".6" /><path d="M61 106v16" stroke="#24392d" strokeOpacity=".2" />
  </svg>;
}
