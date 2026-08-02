export interface TeamMember {
  name: string;
  role: string;
  focus: string;
  filled: boolean;
}

// Recruiting is still closing on most leads — placeholders are intentional,
// swap `filled: true` and a real name in as roles get confirmed.
export const team: TeamMember[] = [
  {
    name: "Tharun",
    role: "President",
    focus: "Vision and club direction",
    filled: true,
  },
  {
    name: "Harshith Ashok",
    role: "Vice-President",
    focus: "Everything technical",
    filled: true,
  },
  {
    name: "Vakulabhushan NJ",
    role: "General Secretary",
    focus: "Operations and outreach",
    filled: true,
  },
  {
    name: "Kshama",
    role: "Marketing Head",
    focus: "Comms, brand presence, outreach",
    filled: true,
  },
  {
    name: "Manoj Kanna",
    role: "Technical Head",
    focus: "Projects and mentorship",
    filled: true,
  },
  // {
  //   name: "TBA",
  //   role: "AI/ML Lead",
  //   focus: "AI/ML projects and mentorship",
  //   filled: false,
  // },
  {
    name: "Archita",
    role: "Design Lead",
    focus: "Design and branding",
    filled: true,
  },
  {
    name: "Srinideesh",
    role: "Development Lead",
    focus: "Web and app development",
    filled: true,
  },
  {
    name: "Priyanga",
    role: "External Affairs",
    focus: "Partnerships and press",
    filled: true,
  },
  {
    name: "Krishnan",
    role: "PR Lead",
    focus: "Public relations and media outreach",
    filled: true,
  },
];
