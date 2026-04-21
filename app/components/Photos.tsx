"use client";
import { useEffect, useMemo, useState } from "react";
import { mockPhotoPalettes } from "../lib/mockData";

type Palette = { title: string; meta: string; hue: number; hue2: number };

function PaintedCanvas({ p }: { p: Palette }) {
  const gid = `pg-${p.hue}-${p.hue2}`;
  const pid = `pp-${p.hue}-${p.hue2}`;
  return (
    <svg viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor={`oklch(0.72 0.12 ${p.hue})`} />
          <stop offset="55%"  stopColor={`oklch(0.48 0.11 ${(p.hue + p.hue2) / 2})`} />
          <stop offset="100%" stopColor={`oklch(0.22 0.06 ${p.hue2})`} />
        </linearGradient>
        <pattern id={pid} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="#fff" strokeOpacity="0.04" strokeWidth="3" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="600" height="400" fill={`url(#${gid})`} />
      <rect x="0" y="0" width="600" height="400" fill={`url(#${pid})`} />
      <circle cx="460" cy="130" r="70" fill="#fff" fillOpacity="0.10" />
      <rect x="0" y="280" width="600" height="120" fill="#000" fillOpacity="0.18" />
      <path d="M0 320 L180 250 L320 290 L500 220 L600 260 L600 400 L0 400 Z" fill="#000" fillOpacity="0.22" />
    </svg>
  );
}

export default function Photos({ className = "" }: { className?: string }) {
  const [real, setReal] = useState<string[]>([]);
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    fetch("/api/photos")
      .then((r) => r.json())
      .then((d) => setReal(d.photos ?? []))
      .catch(() => {});
  }, []);

  const slides = useMemo(() => {
    if (real.length > 0) {
      return real.map((url, i) => ({
        url,
        title: decodeURIComponent(url.split("/").pop() ?? `Photo ${i + 1}`).replace(/\.[^.]+$/, ""),
        meta: "From your album",
      }));
    }
    return mockPhotoPalettes.map((p) => ({ url: null, title: p.title, meta: p.meta, palette: p }));
  }, [real]);

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIdx((i) => (i + 1) % slides.length);
        setFading(false);
      }, 600);
    }, 6500);
    return () => clearInterval(t);
  }, [slides.length]);

  if (slides.length === 0) return <div className={`card photos ${className}`} />;

  const slide = slides[idx];

  return (
    <div className={`card flush photos ${className}`}>
      <div className={"photo-frame" + (fading ? " out" : "")} key={idx}>
        {slide.url ? (
          <img src={slide.url} alt={slide.title} />
        ) : (
          // @ts-expect-error — palette present when url is null
          <PaintedCanvas p={slide.palette} />
        )}
      </div>
      <div className="photo-dots">
        {slides.map((_, i) => (
          <i key={i} className={i === idx ? "on" : ""} />
        ))}
      </div>
      <div className="photo-caption">
        <div>
          <div className="title">{slide.title}</div>
          <div className="meta">{slide.meta}</div>
        </div>
        <div className="meta">{idx + 1} / {slides.length}</div>
      </div>
    </div>
  );
}
