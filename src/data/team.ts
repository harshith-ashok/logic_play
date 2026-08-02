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
    name: "TBA",
    role: "Founder & Lead",
    focus: "Vision and club direction",
    filled: false,
  },
  {
    name: "Kshama",
    role: "Marketing Head",
    focus: "Comms, brand presence, outreach",
    filled: true,
  },
  {
    name: "TBA",
    role: "PR Lead",
    focus: "Partnerships and press",
    filled: false,
  },
  {
    name: "TBA",
    role: "Ops Lead",
    focus: "Events and logistics",
    filled: false,
  },
  {
    name: "TBA",
    role: "Tech Lead",
    focus: "Projects and mentorship",
    filled: false,
  },
  {
    name: "TBA",
    role: "Design Lead",
    focus: "Brand and visual systems",
    filled: false,
  },
];
