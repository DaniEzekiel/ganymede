"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";
import Icon from "./Icon";
import { demoTasks } from "../lib/mockData";

const openSettings = () => window.dispatchEvent(new CustomEvent("ganymede:open-settings"));

type Task = { id: string; label: string; done: boolean; meta: string };
type TasksResponse =
  | { configured: false }
  | { configured: true; tasks: Task[] }
  | { error: string };

const POLL_MS = 2 * 60 * 1000;

export default function Tasks({ className = "" }: { className?: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      const body: TasksResponse = await res.json();
      if (!res.ok) {
        setErr("error" in body ? body.error : `HTTP ${res.status}`);
        return;
      }
      if ("configured" in body && body.configured === false) {
        setConfigured(false);
        setTasks(demoTasks.map((t) => ({ ...t })));
        setErr(null);
        return;
      }
      if ("configured" in body && body.configured === true) {
        setConfigured(true);
        setTasks(body.tasks);
        setErr(null);
      }
    } catch (e) {
      setErr((e as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    const handler = () => load();
    window.addEventListener("ganymede:config-changed", handler);
    window.addEventListener("ganymede:refresh", handler);
    return () => {
      window.removeEventListener("ganymede:config-changed", handler);
      window.removeEventListener("ganymede:refresh", handler);
    };
  }, [load]);

  const demo = configured === false;

  const toggle = async (id: string) => {
    const target = tasks.find((t) => t.id === id);
    if (!target) return;
    const nextDone = !target.done;
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: nextDone } : t)));
    if (demo) return; // sample data: keep changes local, never call the API
    try {
      const res = await fetch(`/api/tasks/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: nextDone }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: target.done } : t)));
    }
  };

  const add = async (e: FormEvent) => {
    e.preventDefault();
    const title = input.trim();
    if (!title || adding) return;
    if (demo) {
      setTasks((prev) => [{ id: `demo-${Date.now()}`, label: title, done: false, meta: "" }, ...prev]);
      setInput("");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as { task: Task };
      setTasks((prev) => [body.task, ...prev]);
      setInput("");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setAdding(false);
    }
  };

  const done = tasks.filter((t) => t.done).length;
  const total = tasks.length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className={`card tasks ${className}`}>
      <div className="card-head">
        <div className="card-title">Tasks</div>
        {demo ? (
          <button type="button" className="demo-badge" onClick={openSettings} title="Sign in to use your own tasks">
            Demo
          </button>
        ) : (
          <div className="card-sub">{done} of {total} done</div>
        )}
      </div>
      <form className="task-add" onSubmit={add}>
        <input
          type="text"
          placeholder="Add a task…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={adding}
        />
        <button type="submit" disabled={adding || !input.trim()} aria-label="Add task">+</button>
      </form>
      {err && <div className="error" style={{ marginTop: 4 }}>{err}</div>}
      <ul>
        {[...tasks].sort((a, b) => Number(a.done) - Number(b.done)).map((t) => (
          <li key={t.id} className={t.done ? "done" : ""} onClick={() => toggle(t.id)}>
            <div className="box"><Icon name="check" size={12} /></div>
            <div className="label">{t.label}</div>
            <div className="meta">{t.meta}</div>
          </li>
        ))}
      </ul>
      {total > 0 && (
        <div className="progress">
          <div className="count">{done}/{total}</div>
          <div className="bar"><span style={{ width: `${pct}%` }} /></div>
          <div className="count">{pct}%</div>
        </div>
      )}
    </div>
  );
}
