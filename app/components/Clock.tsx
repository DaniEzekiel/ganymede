"use client";
import { useEffect, useState } from "react";

type Sun = { rise: string; set: string };

export default function Clock({ sun, className = "" }: { sun?: Sun; className?: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(id);
  }, []);

  const h = now ? now.getHours() : 0;
  const m = now ? now.getMinutes() : 0;
  const h12 = ((h + 11) % 12) + 1;
  const mm = String(m).padStart(2, "0");
  const longDate = now
    ? now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })
    : "";

  return (
    <div className={`card clock ${className}`}>
      <div>
        <div className="time">
          {now ? h12 : "--"}<span style={{ opacity: 0.45 }}>:</span>{now ? mm : "--"}
          <span className="am">{h >= 12 ? "PM" : "AM"}</span>
        </div>
      </div>
      <div className="datebar">
        <div className="long-date">{longDate || " "}</div>
        {sun && (
          <div className="sun">
            <div><strong>{sun.rise}</strong>Sunrise</div>
            <div><strong>{sun.set}</strong>Sunset</div>
          </div>
        )}
      </div>
    </div>
  );
}
