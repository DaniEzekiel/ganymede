"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";

type Photo = { url: string; title: string; meta: string };
type PhotosResponse =
  | { configured: false }
  | { configured: true; source: string; photos: Photo[]; error?: string }
  | { error: string };

const ROTATE_MS = 60_000;
const FADE_MS = 600;
const POLL_MS = 15 * 60_000;

export default function Photos({ className = "" }: { className?: string }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);
  const [resetTick, setResetTick] = useState(0);
  const [urlInput, setUrlInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/photos");
      const body: PhotosResponse = await res.json();
      if ("configured" in body && body.configured === false) {
        setConfigured(false);
        setPhotos([]);
        setLoadErr(null);
        return;
      }
      if ("configured" in body && body.configured === true) {
        setConfigured(true);
        setPhotos(body.photos ?? []);
        setLoadErr(body.error ?? null);
        return;
      }
      setLoadErr("error" in body ? body.error : "unknown response");
    } catch (e) {
      setLoadErr((e as Error).message);
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
    return () => window.removeEventListener("ganymede:config-changed", handler);
  }, [load]);

  const advance = useCallback(() => {
    if (photos.length < 2) return;
    setFading(true);
    setTimeout(() => {
      setIdx((i) => (i + 1) % photos.length);
      setFading(false);
    }, FADE_MS);
  }, [photos.length]);

  useEffect(() => {
    if (photos.length < 2) return;
    const t = setInterval(advance, ROTATE_MS);
    return () => clearInterval(t);
  }, [advance, resetTick]);

  const handleTap = () => {
    if (fading || photos.length < 2) return;
    advance();
    setResetTick((n) => n + 1);
  };

  const connect = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveErr(null);
    try {
      const r = await fetch("/api/config/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput }),
      });
      const body = await r.json();
      if (!r.ok) {
        setSaveErr(body.error ?? `HTTP ${r.status}`);
        return;
      }
      setUrlInput("");
      await load();
      window.dispatchEvent(new CustomEvent("ganymede:config-changed"));
    } catch (e) {
      setSaveErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (configured === false) {
    return (
      <div className={`card photos ${className}`}>
        <div className="card-head">
          <div className="card-title">Photos</div>
          <div className="card-sub">Setup required</div>
        </div>
        <div className="widget-setup">
          <h3>Connect Apple Photos</h3>
          <ol>
            <li>In Apple Photos, open a shared album.</li>
            <li>Tap the people icon <strong>›</strong> <strong>Public Website</strong> &mdash; turn it on.</li>
            <li>Copy the link Apple generates.</li>
            <li>Paste it below and click <strong>Connect</strong>.</li>
          </ol>
          <form className="widget-connect-form" onSubmit={connect}>
            <input
              type="url"
              placeholder="https://www.icloud.com/sharedalbum/#…"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              disabled={saving}
              required
            />
            <button type="submit" className="btn-primary" disabled={saving || !urlInput.trim()}>
              {saving ? "Connecting…" : "Connect"}
            </button>
          </form>
          {saveErr && <div className="error">{saveErr}</div>}
          <p className="widget-setup-note">Anyone with this link can view the album. Don&rsquo;t share it widely.</p>
        </div>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className={`card photos ${className}`}>
        <div className="card-head">
          <div className="card-title">Photos</div>
          <div className="card-sub">{loadErr ? "Failed to load" : "Empty album"}</div>
        </div>
        {loadErr && <div className="error" style={{ padding: 16 }}>{loadErr}</div>}
      </div>
    );
  }

  const safeIdx = idx % photos.length;
  const photo = photos[safeIdx];

  return (
    <div className={`card flush photos ${className}`}>
      <div
        className={"photo-frame" + (fading ? " out" : "")}
        key={safeIdx}
        onClick={handleTap}
        role="button"
        aria-label="Next photo"
      >
        <img src={photo.url} alt={photo.title} />
      </div>
      <div className="photo-dots">
        {photos.map((_, i) => (
          <i key={i} className={i === safeIdx ? "on" : ""} />
        ))}
      </div>
      <div className="photo-caption">
        <div>
          <div className="title">{photo.title}</div>
          <div className="meta">{photo.meta}</div>
        </div>
        <div className="meta">{safeIdx + 1} / {photos.length}</div>
      </div>
    </div>
  );
}
