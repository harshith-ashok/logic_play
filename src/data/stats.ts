export interface Stat {
  label: string;
  value: number;
  suffix?: string;
}

export const stats: Stat[] = [
  { label: "Members", value: 250, suffix: "+" },
  { label: "Projects Shipped", value: 40, suffix: "+" },
  { label: "Workshops Hosted", value: 30, suffix: "+" },
  { label: "Hackathons Won", value: 12 },
];
