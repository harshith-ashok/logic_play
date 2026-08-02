export const boilerplate =
  "Logic Play is an AI-focused innovation club built for students who'd rather ship than watch.";

export const about =
  "Logic Play is an AI-focused innovation club that gives students a platform to explore, build, and research with emerging technology. We work across Artificial Intelligence, Machine Learning, Deep Learning, Generative AI, Computer Vision, NLP, Robotics, IoT, and Data Science — through hands-on projects, hackathons, workshops, and mentorship — with the goal of turning ideas into real papers, patents, and products, not just resume lines.";

export interface BrandColor {
  name: string;
  hex: string;
}

export const brandColors: BrandColor[] = [
  { name: "Background", hex: "#08090B" },
  { name: "Foreground", hex: "#FFFFFF" },
  { name: "Accent", hex: "#FF3B3B" },
];

export interface LogoAsset {
  label: string;
  src: string;
  file: string;
}

// Placeholder until a real press inbox / handle exists — swap in once set up.
export const contact = {
  name: "Kshama",
  role: "Marketing Head",
  email: "TBA",
};
