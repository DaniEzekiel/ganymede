import { mockCommute } from "../lib/mockData";

export default function Commute({ className = "" }: { className?: string }) {
  return (
    <div className={`card commute ${className}`}>
      <div className="card-head">
        <div className="card-title">Commute</div>
        <div className="card-sub">Live traffic</div>
      </div>
      {mockCommute.map((r, i) => (
        <div className="route" key={i}>
          <div className="line">
            <div className="name">{r.name}</div>
            <div className="sub">{r.sub}</div>
          </div>
          <div className={"mins " + r.state}>
            {r.mins}<span className="unit">min</span>
          </div>
        </div>
      ))}
    </div>
  );
}
