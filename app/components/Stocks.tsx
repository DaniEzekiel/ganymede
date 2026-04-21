import { mockStocks } from "../lib/mockData";

function Spark({ data, up }: { data: number[]; up: boolean }) {
  const w = 48, h = 18;
  const min = Math.min(...data), max = Math.max(...data);
  const rng = Math.max(1, max - min);
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / rng) * h}`)
    .join(" ");
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`}>
      <polyline
        fill="none"
        stroke={up ? "oklch(0.55 0.10 150)" : "oklch(0.55 0.14 28)"}
        strokeWidth="1.25"
        points={pts}
      />
    </svg>
  );
}

export default function Stocks({ className = "" }: { className?: string }) {
  return (
    <div className={`card stocks ${className}`}>
      <div className="card-head">
        <div className="card-title">Markets</div>
        <div className="card-sub">Delayed 15m</div>
      </div>
      <table>
        <thead>
          <tr><th>Ticker</th><th></th><th>Price</th><th>Chg</th></tr>
        </thead>
        <tbody>
          {mockStocks.map((s) => (
            <tr key={s.sym}>
              <td className="sym">{s.sym}</td>
              <td><Spark data={s.spark} up={s.chg >= 0} /></td>
              <td className="price">{s.price.toFixed(2)}</td>
              <td className={"chg " + (s.chg >= 0 ? "up" : "dn")}>
                {s.chg >= 0 ? "+" : ""}{s.chg.toFixed(2)}{" "}
                <span style={{ opacity: 0.75 }}>
                  ({s.pct >= 0 ? "+" : ""}{s.pct.toFixed(2)}%)
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
