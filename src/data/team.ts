export interface TeamMember {
  name: string;
  role: string;
  initials: string;
  links: { label: string; href: string }[];
}

export const team: TeamMember[] = [
  {
    name: "Aarav Mehta",
    role: "President",
    initials: "AM",
    links: [
      { label: "GitHub", href: "#" },
      { label: "LinkedIn", href: "#" },
    ],
  },
  {
    name: "Sara Kim",
    role: "Vice President",
    initials: "SK",
    links: [
      { label: "GitHub", href: "#" },
      { label: "X", href: "#" },
    ],
  },
  {
    name: "Devraj Singh",
    role: "Lead, AI",
    initials: "DS",
    links: [
      { label: "GitHub", href: "#" },
      { label: "LinkedIn", href: "#" },
    ],
  },
  {
    name: "Maya Chen",
    role: "Lead, Web",
    initials: "MC",
    links: [
      { label: "GitHub", href: "#" },
      { label: "LinkedIn", href: "#" },
    ],
  },
  {
    name: "Ibrahim Farooq",
    role: "Lead, Cyber Security",
    initials: "IF",
    links: [
      { label: "GitHub", href: "#" },
      { label: "X", href: "#" },
    ],
  },
  {
    name: "Elena Petrova",
    role: "Lead, Design",
    initials: "EP",
    links: [
      { label: "GitHub", href: "#" },
      { label: "LinkedIn", href: "#" },
    ],
  },
];
