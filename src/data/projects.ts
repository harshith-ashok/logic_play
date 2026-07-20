export interface Project {
  name: string;
  domain: string;
  description: string;
  stack: string[];
  href: string;
}

export const projects: Project[] = [
  {
    name: "Pathfinder",
    domain: "AI",
    description: "A visual algorithm playground for exploring pathfinding and search heuristics in real time.",
    stack: ["Python", "FastAPI", "React"],
    href: "#",
  },
  {
    name: "DevSync",
    domain: "Web",
    description: "Real-time collaborative code editor with live cursors and session replay.",
    stack: ["TypeScript", "WebSocket", "CRDT"],
    href: "#",
  },
  {
    name: "ChainVote",
    domain: "Web3",
    description: "A transparent, on-chain voting protocol for campus elections and club polls.",
    stack: ["Solidity", "Hardhat", "Ethers.js"],
    href: "#",
  },
  {
    name: "Sentry CLI",
    domain: "Cyber Security",
    description: "A lightweight CLI that scans repositories for leaked secrets before every push.",
    stack: ["Rust", "Git Hooks"],
    href: "#",
  },
  {
    name: "Glyph",
    domain: "Design",
    description: "An open component library built around the club's monospaced design system.",
    stack: ["Vue", "Tailwind", "Figma"],
    href: "#",
  },
  {
    name: "Relay",
    domain: "Operations",
    description: "Internal tool for scheduling events, tracking RSVPs, and managing member roles.",
    stack: ["Node.js", "PostgreSQL"],
    href: "#",
  },
];
