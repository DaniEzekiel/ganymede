import { NextResponse } from "next/server";

export const revalidate = 600;

const CODE_TO_DESC: Record<number, string> = {
  0: "Clear", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Rime fog", 51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle",
  61: "Light rain", 63: "Rain", 65: "Heavy rain", 71: "Light snow", 73: "Snow",
  75: "Heavy snow", 80: "Rain showers", 81: "Rain showers", 82: "Violent showers",
  95: "Thunderstorm", 96: "Thunderstorm w/ hail", 99: "Thunderstorm w/ hail",
};

function codeToIcon(code: number): "sun" | "cloud-sun" | "cloud" | "rain" {
  if (code === 0) return "sun";
  if (code === 1) return "cloud-sun";
  if (code <= 48) return "cloud";
  return "rain";
}

function formatHour(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}${h >= 12 ? "p" : "a"}`;
}

function formatDow(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
}

function formatClock(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export async function GET() {
  const lat = process.env.WEATHER_LAT ?? "40.7128";
  const lon = process.env.WEATHER_LON ?? "-74.0060";
  const tz = process.env.WEATHER_TZ ?? "auto";

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,apparent_temperature,weather_code` +
    `&hourly=temperature_2m,weather_code` +
    `&daily=temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset` +
    `&timezone=${encodeURIComponent(tz)}` +
    `&temperature_unit=fahrenheit&forecast_days=6`;

  try {
    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) throw new Error(`upstream ${res.status}`);
    const data = await res.json();

    const nowIso: string = data.current.time;
    const hourlyTimes: string[] = data.hourly.time;
    const hourlyTemps: number[] = data.hourly.temperature_2m;
    const hourlyCodes: number[] = data.hourly.weather_code;

    const rawStart = hourlyTimes.findIndex((t) => t >= nowIso);
    const maxStart = Math.max(0, hourlyTimes.length - 6);
    const startIdx = Math.min(Math.max(0, rawStart), maxStart);
    const hours = Array.from({ length: 6 }, (_, i) => {
      const idx = startIdx + i;
      return {
        h: formatHour(hourlyTimes[idx]),
        t: Math.round(hourlyTemps[idx]),
        i: codeToIcon(hourlyCodes[idx]),
      };
    });

    const highs: number[] = data.daily.temperature_2m_max;
    const lows: number[] = data.daily.temperature_2m_min;
    const weekMin = Math.min(...lows);
    const weekMax = Math.max(...highs);
    const rng = Math.max(1, weekMax - weekMin);

    const days = data.daily.time.slice(0, 5).map((iso: string, i: number) => ({
      d: formatDow(iso),
      i: codeToIcon(data.daily.weather_code[i]),
      hi: Math.round(highs[i]),
      lo: Math.round(lows[i]),
      lowPct: Math.round(((lows[i] - weekMin) / rng) * 100),
      highPct: Math.round(((highs[i] - weekMin) / rng) * 100),
    }));

    return NextResponse.json({
      current: {
        temp: Math.round(data.current.temperature_2m),
        feels: Math.round(data.current.apparent_temperature),
        cond: CODE_TO_DESC[data.current.weather_code] ?? "—",
        icon: codeToIcon(data.current.weather_code),
        hi: Math.round(highs[0]),
        lo: Math.round(lows[0]),
      },
      hours,
      days,
      sun: {
        rise: formatClock(data.daily.sunrise[0]),
        set: formatClock(data.daily.sunset[0]),
      },
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
