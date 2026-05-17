"use client";
import { useCallback, useEffect, useState } from "react";
import Icon from "./Icon";

type Status =
  | { configured: false; source: "none" }
  | { configured: true; source: "env" | "file"; hint: string };

export default function Settings() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/config");
      if (r.ok) setStatus(await r.json());
    } catch {}
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  useEffect(() => {
    const handler = () => load();
    window.addEventListener("ganymede:config-changed", handler);
    return () => window.removeEventListener("ganymede:config-changed", handler);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const disconnect = async () => {
    setBusy(true);
    try {
      await fetch("/api/config", { method: "DELETE" });
      await load();
      window.dispatchEvent(new CustomEvent("ganymede:config-changed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button className="gear-btn" onClick={() => setOpen(true)} aria-label="Settings" title="Settings">
        <Icon name="gear" size={16} />
      </button>
      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal" role="dialog" aria-label="Settings" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Settings</h2>
              <button className="modal-close" onClick={() => setOpen(false)} aria-label="Close">
                <Icon name="x" size={16} />
              </button>
            </div>
            <section className="settings-section">
              <h3>Google Calendar</h3>
              {status === null ? (
                <p className="settings-meta">Loading…</p>
              ) : status.configured ? (
                <>
                  <p className="settings-meta">Connected · <code>{status.hint}</code></p>
                  {status.source === "env" ? (
                    <p className="settings-note">Set via <code>.env.local</code> &mdash; edit the file to change.</p>
                  ) : (
                    <button className="btn-secondary" onClick={disconnect} disabled={busy}>
                      {busy ? "Disconnecting…" : "Disconnect"}
                    </button>
                  )}
                </>
              ) : (
                <p className="settings-meta">Not connected. Use the calendar widget to add a URL.</p>
              )}
            </section>
          </div>
        </div>
      )}
    </>
  );
}
