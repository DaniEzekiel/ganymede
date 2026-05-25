"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { demoPhotos } from "../lib/mockData";

const openSettings = () => window.dispatchEvent(new CustomEvent("ganymede:open-settings"));

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

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/photos");
      const body: PhotosResponse = await res.json();
      if ("configured" in body && body.configured === false) {
        setConfigured(false);
        setPhotos(demoPhotos());
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
    window.addEventListener("ganymede:refresh", handler);
    return () => {
      window.removeEventListener("ganymede:config-changed", handler);
      window.removeEventListener("ganymede:refresh", handler);
    };
  }, [load]);

  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const advance = useCallback(() => {
    if (photos.length < 2) return;
    setFading(true);
    if (fadeTimer.current) clearTimeout(fadeTimer.current);
    fadeTimer.current = setTimeout(() => {
      setIdx((i) => (i + 1) % photos.length);
      setFading(false);
      fadeTimer.current = null;
    }, FADE_MS);
  }, [photos.length]);

  useEffect(() => {
    if (photos.length < 2) return;
    const t = setInterval(advance, ROTATE_MS);
    return () => clearInterval(t);
  }, [advance, resetTick]);

  useEffect(() => {
    return () => {
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
    };
  }, []);

  const handleTap = () => {
    if (fading || photos.length < 2) return;
    advance();
    setResetTick((n) => n + 1);
  };

  const demo = configured === false;

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
      {demo && (
        <button type="button" className="demo-badge" onClick={openSettings} title="Connect your own album in Settings">
          Demo
        </button>
      )}
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
