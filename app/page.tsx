"use client";
import { useEffect, useState } from "react";
import Clock from "./components/Clock";
import Weather, { type WeatherData } from "./components/Weather";
import Calendar from "./components/Calendar";
import Photos from "./components/Photos";
import News from "./components/News";
import Tasks from "./components/Tasks";
import Home from "./components/Home";
import Commute from "./components/Commute";
import Stocks from "./components/Stocks";
import Quote from "./components/Quote";

const NAME = process.env.NEXT_PUBLIC_DASHBOARD_NAME ?? "GANYMEDE · HOME";
const LOCATION = process.env.NEXT_PUBLIC_DASHBOARD_LOCATION ?? "Brookline, Mass.";

export default function Dashboard() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [syncedAt, setSyncedAt] = useState<string>("");

  useEffect(() => {
    const tick = () =>
      setSyncedAt(new Date().toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <main className="canvas">
      <div className="topstrip">
        <div className="crumb">{NAME}</div>
        <span className="dot" />
        <div className="place">{LOCATION}</div>
        <div className="pill">
          <span className="live-dot" />Live · synced {syncedAt || "—"}
        </div>
      </div>
      <div className="grid">
        <Clock    className="w-clock"    sun={weather?.sun} />
        <Weather  className="w-weather"  location={LOCATION} onData={setWeather} />
        <Photos   className="w-photos" />
        <Calendar className="w-calendar" />
        <News     className="w-news" />
        <Tasks    className="w-tasks" />
        <Home     className="w-home" />
        <Commute  className="w-commute" />
        <Stocks   className="w-stocks" />
        <Quote    className="w-quote" />
      </div>
    </main>
  );
}
