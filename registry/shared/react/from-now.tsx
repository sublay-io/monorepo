// The wording for each step, supplied by the component's strings file so
// every language can use its own plural forms and word order.
export interface TimeAgoStrings {
  justNow: string;
  minutes: (count: number) => string;
  hours: (count: number) => string;
  days: (count: number) => string;
  months: (count: number) => string;
  years: (count: number) => string;
}

function formatTime(time: Date | string, strings: TimeAgoStrings): string {
  const seconds = Math.floor((Date.now() - new Date(time).getTime()) / 1000);

  if (seconds < 60) return strings.justNow;
  if (seconds < 3600) return strings.minutes(Math.floor(seconds / 60));
  if (seconds < 86400) return strings.hours(Math.floor(seconds / 3600));
  // 30 days
  if (seconds < 2592000) return strings.days(Math.floor(seconds / 86400));
  // 365 days
  if (seconds < 31536000) return strings.months(Math.floor(seconds / 2592000));
  return strings.years(Math.floor(seconds / 31536000));
}

function FromNow({
  time,
  strings,
  fontSize = 12,
  fontWeight = 400,
  color = "#737373",
}: {
  time: Date | string;
  strings: TimeAgoStrings;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
}) {
  return (
    <span
      style={{
        fontSize,
        fontWeight,
        color,
      }}
    >
      {formatTime(time, strings)}
    </span>
  );
}

export default FromNow;
