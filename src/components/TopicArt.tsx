/** Abstract editorial marks for discovery categories. */
export default function TopicArt({ variant }: { variant: number }) {
  return <svg viewBox="0 0 120 120" fill="none" aria-hidden="true" className="topic-art" stroke="currentColor" strokeWidth="1">
    {variant === 0 && <><path d="M30 100V48a30 30 0 0 1 60 0v52M42 100V49a18 18 0 0 1 36 0v51M54 100V49a6 6 0 0 1 12 0v51" /><path d="M20 100h80" /></>}
    {variant === 1 && <><circle cx="60" cy="44" r="23" /><path d="M25 81h70M25 89h55M25 97h38" /><path d="M60 21a23 23 0 0 1 0 46" fill="currentColor" opacity=".15" /></>}
    {variant === 2 && <><circle cx="45" cy="60" r="29" /><circle cx="75" cy="60" r="29" /><path d="M60 19v82M16 60h88" strokeOpacity=".35" /></>}
    {variant === 3 && <><circle cx="60" cy="60" r="34" /><ellipse cx="60" cy="60" rx="15" ry="45" transform="rotate(40 60 60)" /><path d="M16 60h88M60 16v88" strokeOpacity=".35" /><circle cx="60" cy="60" r="3" fill="currentColor" /></>}
  </svg>;
}
