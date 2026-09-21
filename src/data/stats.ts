export interface Stat {
  label: string;
  value: number;
  suffix?: string;
}

// Hero counters. Update as the club grows.
export const stats: Stat[] = [
  { label: "Projects shipped", value: 30, suffix: "+" },
  { label: "Papers published", value: 3, suffix: "+" },
  { label: "Hackathon wins", value: 10, suffix: "+" },
];
