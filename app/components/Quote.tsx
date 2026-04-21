import { mockQuote } from "../lib/mockData";

export default function Quote({ className = "" }: { className?: string }) {
  return (
    <div className={`card quote-card ${className}`}>
      <div className="card-head">
        <div className="card-title">Daily quote</div>
      </div>
      <div className="q">&ldquo;{mockQuote.q}&rdquo;</div>
      <div className="a">— {mockQuote.a}</div>
    </div>
  );
}
