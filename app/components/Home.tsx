"use client";
import { useState } from "react";
import Icon from "./Icon";
import { mockHome } from "../lib/mockData";

export default function Home({ className = "" }: { className?: string }) {
  const [tiles, setTiles] = useState(mockHome);
  const toggle = (id: string) =>
    setTiles((prev) => prev.map((t) => (t.id === id ? { ...t, on: !t.on } : t)));

  return (
    <div className={`card home ${className}`}>
      <div className="card-head">
        <div className="card-title">Home</div>
        <div className="card-sub">{tiles.filter((t) => t.on).length} active</div>
      </div>
      <div className="home-grid">
        {tiles.map((t) => (
          <div key={t.id} className={"home-tile" + (t.on ? " on" : "")} onClick={() => toggle(t.id)}>
            <div className="icon"><Icon name={t.icon} size={22} /></div>
            <div className="name">{t.name}</div>
            <div className="row"><span>{t.sub}</span><span className="state">{t.state}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}
