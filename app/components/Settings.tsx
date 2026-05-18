"use client";
import { useCallback, useEffect, useState } from "react";
import Icon from "./Icon";

type PhotosStatus =
  | { configured: false; source: "none" }
  | { configured: true; source: "env" | "file" | "dir"; hint: string };

type GoogleStatus = { connected: false } | { connected: true; email: string | null };

type ConfigStatus = { google: GoogleStatus; photos: PhotosStatus };

export default function Settings() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<ConfigStatus | null>(null);
  const [busy, setBusy] = useState<"google" | "photos" | null>(null);
  const [refreshed, setRefreshed] = useState(false);

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

  const disconnectGoogle = async () => {
    setBusy("google");
    try {
      await fetch("/api/auth/google/disconnect", { method: "POST" });
      await load();
      window.dispatchEvent(new CustomEvent("ganymede:config-changed"));
    } finally {
      setBusy(null);
    }
  };

  const disconnectPhotos = async () => {
    setBusy("photos");
    try {
      await fetch("/api/config/photos", { method: "DELETE" });
      await load();
      window.dispatchEvent(new CustomEvent("ganymede:config-changed"));
    } finally {
      setBusy(null);
    }
  };

  const refreshAll = () => {
    window.dispatchEvent(new CustomEvent("ganymede:refresh"));
    load();
    setRefreshed(true);
    window.setTimeout(() => setRefreshed(false), 1500);
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
            <div className="settings-actions">
              <button className="btn-secondary" onClick={refreshAll} disabled={refreshed}>
                {refreshed ? "Refreshed" : "Refresh all"}
              </button>
              <span className="settings-actions-hint">
                Re-fetches weather, calendar, tasks, and photos.
              </span>
            </div>
            {status === null ? (
              <p className="settings-meta">Loading…</p>
            ) : (
              <>
                <section className="settings-section">
                  <h3>Google</h3>
                  {status.google.connected ? (
                    <>
                      <p className="settings-meta">
                        Connected{status.google.email ? <> · <code>{status.google.email}</code></> : null}
                        <br />Powers Calendar and Tasks.
                      </p>
                      <button
                        className="btn-secondary"
                        onClick={disconnectGoogle}
                        disabled={busy === "google"}
                      >
                        {busy === "google" ? "Disconnecting…" : "Disconnect"}
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="settings-meta">Not connected.</p>
                      <a className="btn-primary" href="/api/auth/google/start" style={{ display: "inline-block" }}>
                        Sign in with Google
                      </a>
                    </>
                  )}
                </section>
                <section className="settings-section">
                  <h3>Apple Photos</h3>
                  {status.photos.configured ? (
                    <>
                      <p className="settings-meta">Connected · <code>{status.photos.hint}</code></p>
                      {status.photos.source === "file" ? (
                        <button
                          className="btn-secondary"
                          onClick={disconnectPhotos}
                          disabled={busy === "photos"}
                        >
                          {busy === "photos" ? "Disconnecting…" : "Disconnect"}
                        </button>
                      ) : (
                        <p className="settings-note">
                          Set via <code>.env.local (PHOTOS_DIR)</code> &mdash; edit the file to change.
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="settings-meta">
                      Not connected. Use the photos widget to add a URL.
                    </p>
                  )}
                </section>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
