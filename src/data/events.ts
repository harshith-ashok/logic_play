export interface TimelineEvent {
  date: string;
  title: string;
  description: string;
}

export const events: TimelineEvent[] = [
  {
    date: "Aug 2026",
    title: "Kickoff Meet",
    description: "Orientation for new members, domain intros, and a walkthrough of the year's roadmap.",
  },
  {
    date: "Sep 2026",
    title: "Build Week",
    description: "A five-day sprint where teams ship a working prototype from scratch.",
  },
  {
    date: "Oct 2026",
    title: "Security CTF",
    description: "Campus-wide capture-the-flag hosted by the Cyber Security domain.",
  },
  {
    date: "Dec 2026",
    title: "Web3 Workshop",
    description: "Hands-on session on smart contracts, wallets, and deploying to testnets.",
  },
  {
    date: "Feb 2027",
    title: "Hackathon Sprint",
    description: "24-hour hackathon in partnership with neighboring college tech clubs.",
  },
  {
    date: "Apr 2027",
    title: "Demo Day",
    description: "Teams present shipped projects to mentors, alumni, and local founders.",
  },
];
