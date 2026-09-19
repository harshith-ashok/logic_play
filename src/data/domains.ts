export interface Domain {
  name: string;
  /** One line on what the club does in this area. */
  summary: string;
  /** Roles a member can take on. */
  roles: string[];
  /** Kinds of projects built here. Placeholders until real project write-ups land. */
  projects: string[];
}

export const domains: Domain[] = [
  {
    name: "Artificial Intelligence",
    summary: "The umbrella: building systems that reason, plan and decide.",
    roles: ["Project lead", "Research contributor", "Competition team member"],
    projects: ["Campus AI assistant", "Rule-based + learned game agents", "Hackathon prototypes"],
  },
  {
    name: "Machine Learning",
    summary: "Turning data into models that hold up outside the notebook.",
    roles: ["Model builder", "Data wrangler", "Evaluation lead"],
    projects: ["Prediction models on real datasets", "Kaggle-style challenges", "Paper reproductions"],
  },
  {
    name: "Deep Learning",
    summary: "Neural networks from first principles to fine-tuning.",
    roles: ["Training engineer", "Architecture reader", "Paper-club presenter"],
    projects: ["Image and sequence models", "Fine-tuning open models", "Journal-paper experiments"],
  },
  {
    name: "Generative AI",
    summary: "LLMs, agents and generators that ship as products.",
    roles: ["Prompt / agent engineer", "Full-stack builder", "Product tinkerer"],
    projects: ["RAG chatbots over club docs", "Agent workflows", "Creative generation tools"],
  },
  {
    name: "Computer Vision",
    summary: "Teaching machines to see: detection, tracking, segmentation.",
    roles: ["Vision engineer", "Dataset annotator", "Edge-deployment tinkerer"],
    projects: ["Object detection apps", "Attendance and safety monitors", "Robot perception"],
  },
  {
    name: "Natural Language Processing",
    summary: "Language models, search and text understanding.",
    roles: ["NLP engineer", "Corpus builder", "Applied researcher"],
    projects: ["Multilingual text tools", "Document Q&A", "Conference-paper submissions"],
  },
  {
    name: "Robotics",
    summary: "Software meets hardware: perception, control, autonomy.",
    roles: ["Controls programmer", "Hardware integrator", "Autonomy lead"],
    projects: ["Autonomous robot builds", "Line-following and navigation bots", "Competition entries"],
  },
  {
    name: "IoT",
    summary: "Sensors, microcontrollers and connected devices.",
    roles: ["Firmware developer", "Sensor integrator", "Dashboard builder"],
    projects: ["Smart-campus sensors", "Telemetry dashboards", "Low-power edge devices"],
  },
  {
    name: "Data Science",
    summary: "Finding the story in data and making it decision-ready.",
    roles: ["Analyst", "Visualization designer", "Pipeline builder"],
    projects: ["Open-data analyses", "Industry case studies", "Interactive dashboards"],
  },
];
