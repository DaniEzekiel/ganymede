"use client";
import { useCallback, useEffect, useState } from "react";
import Icon from "./Icon";

type ResourceStatus =
  | { configured: false; source: "none" }
  | { configured: true; source: "env" | "file" | "dir"; hint: string };

type ConfigStatus = { calendar: ResourceStatus; photos: ResourceStatus };
type Resource = "calendar" | "photos";

const LABELS: Record<Resource, { title: string; envHint: string }> = {
  calendar: { title: "Google Calendar", envHint: ".env.local" },
  photos: { title: "Apple Photos", envHint: ".env.local (PHOTOS_DIR)" },
};

export default function Settings() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<ConfigStatus | null>(null);
  const [busy, setBusy] = useState<Resource | null>(null);

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

  const disconnect = async (resource: Resource) => {
    setBusy(resource);
    try {
      await fetch(`/api/config/${resource}`, { method: "DELETE" });
      await load();
      window.dispatchEvent(new CustomEvent("ganymede:config-changed"));
    } finally {
      setBusy(null);
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
            {status === null ? (
              <p className="settings-meta">Loading…</p>
            ) : (
              (["calendar", "photos"] as const).map((r) => (
                <section className="settings-section" key={r}>
                  <h3>{LABELS[r].title}</h3>
                  {status[r].configured ? (
                    <>
                      <p className="settings-meta">Connected · <code>{status[r].hint}</code></p>
                      {status[r].source === "file" ? (
                        <button
                          className="btn-secondary"
                          onClick={() => disconnect(r)}
                          disabled={busy === r}
                        >
                          {busy === r ? "Disconnecting…" : "Disconnect"}
                        </button>
                      ) : (
                        <p className="settings-note">
                          Set via <code>{LABELS[r].envHint}</code> &mdash; edit the file to change.
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="settings-meta">
                      Not connected. Use the {r} widget to add a URL.
                    </p>
                  )}
                </section>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
