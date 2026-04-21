"use client";
import { useState } from "react";
import Icon from "./Icon";
import { mockTasks } from "../lib/mockData";

export default function Tasks({ className = "" }: { className?: string }) {
  const [tasks, setTasks] = useState(mockTasks);
  const done = tasks.filter((t) => t.done).length;
  const toggle = (id: string) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  return (
    <div className={`card tasks ${className}`}>
      <div className="card-head">
        <div className="card-title">Tasks</div>
        <div className="card-sub">{done} of {tasks.length} done</div>
      </div>
      <ul>
        {tasks.map((t) => (
          <li key={t.id} className={t.done ? "done" : ""} onClick={() => toggle(t.id)}>
            <div className="box"><Icon name="check" size={12} /></div>
            <div className="label">{t.label}</div>
            <div className="meta">{t.meta}</div>
          </li>
        ))}
      </ul>
      <div className="progress">
        <div className="count">{done}/{tasks.length}</div>
        <div className="bar"><span style={{ width: `${(done / tasks.length) * 100}%` }} /></div>
        <div className="count">{Math.round((done / tasks.length) * 100)}%</div>
      </div>
    </div>
  );
}
