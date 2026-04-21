import { mockNews } from "../lib/mockData";

export default function News({ className = "" }: { className?: string }) {
  return (
    <div className={`card news ${className}`}>
      <div className="card-head">
        <div className="card-title">News</div>
        <div className="card-sub">Morning briefing</div>
      </div>
      <div className="lede">
        <div className="tag">{mockNews.lede.tag}</div>
        <h4>{mockNews.lede.head}</h4>
        <p>{mockNews.lede.dek}</p>
      </div>
      <ul>
        {mockNews.items.map((it, i) => (
          <li key={i}>
            <div className="src">{it.src}</div>
            <div className="h">{it.h}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
