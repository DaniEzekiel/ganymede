type IconName =
  | "sun" | "cloud-sun" | "cloud" | "rain"
  | "bulb" | "therm" | "lock" | "garage" | "music"
  | "check" | "chevL" | "chevR";

const PATHS: Record<IconName, React.ReactNode> = {
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </>
  ),
  "cloud-sun": (
    <>
      <path d="M12 3v1.5M4.5 7 5.5 8M19.5 7 18.5 8M3 12h1.5" />
      <circle cx="8" cy="10" r="3" />
      <path d="M6 18h10a3.5 3.5 0 0 0 0-7 4.5 4.5 0 0 0-8.5-1.5" />
    </>
  ),
  cloud: <path d="M6 18h11a4 4 0 0 0 0-8 5 5 0 0 0-9.5-1.5A4 4 0 0 0 6 18z" />,
  rain: (
    <>
      <path d="M6 16h11a4 4 0 0 0 0-8 5 5 0 0 0-9.5-1.5A4 4 0 0 0 6 16z" />
      <path d="M9 19l-1 2M13 19l-1 2M17 19l-1 2" />
    </>
  ),
  bulb: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M8 13a5 5 0 1 1 8 0c-1 1-1.5 2-1.5 3h-5c0-1-.5-2-1.5-3z" />
    </>
  ),
  therm: (
    <>
      <path d="M14 14.5V4a2 2 0 0 0-4 0v10.5a4 4 0 1 0 4 0z" />
      <circle cx="12" cy="17" r="1.5" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 1 1 8 0v3" />
    </>
  ),
  garage: (
    <>
      <path d="M3 21V9l9-5 9 5v12" />
      <path d="M6 21v-7h12v7M6 17h12" />
    </>
  ),
  music: (
    <>
      <path d="M9 18V6l10-2v12" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="16" cy="16" r="3" />
    </>
  ),
  check: <path d="M4 12l5 5L20 6" strokeWidth="2.4" />,
  chevL: <path d="M15 6l-6 6 6 6" />,
  chevR: <path d="M9 6l6 6-6 6" />,
};

export type { IconName };
export default function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PATHS[name]}
    </svg>
  );
}
