import type { Component } from "vue";
import { BrainCircuit, Code2, Blocks, ShieldCheck, PenTool, Settings2, Megaphone } from "@lucide/vue";

export interface Domain {
  name: string;
  description: string;
  icon: Component;
}

export const domains: Domain[] = [
  {
    name: "AI",
    description: "Machine learning, LLM tooling, and applied research projects.",
    icon: BrainCircuit,
  },
  {
    name: "Web",
    description: "Full-stack apps, performance, and modern frontend engineering.",
    icon: Code2,
  },
  {
    name: "Web3",
    description: "Smart contracts, protocols, and decentralized systems.",
    icon: Blocks,
  },
  {
    name: "Cyber Security",
    description: "CTFs, pentesting, and infrastructure hardening.",
    icon: ShieldCheck,
  },
  {
    name: "Design",
    description: "Interfaces, motion, and product design systems.",
    icon: PenTool,
  },
  {
    name: "Operations",
    description: "Event logistics, budgeting, and club infrastructure.",
    icon: Settings2,
  },
  {
    name: "PR",
    description: "Outreach, partnerships, and community growth.",
    icon: Megaphone,
  },
];
