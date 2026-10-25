export type AppState =
  | 'HERO'
  | 'PROJECTS'
  | 'SKILLS'
  | 'TERMINAL'
  | 'CONTACT';

export interface CameraStateConfig {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
}

export interface ProjectArchitecture {
  id: string;
  title: string;
  codename: string;
  category: 'Distributed Systems' | 'AI & Inference' | 'WebGL & Graphics' | 'Core Infrastructure';
  shortDesc: string;
  fullDesc: string;
  complexity: {
    time: string;
    space: string;
    throughput: string;
    latency: string;
  };
  architecturalDecisions: string[];
  tradeOffs: {
    planA: string;
    planB: string;
    rationale: string;
  };
  techStack: string[];
  githubUrl?: string;
  liveUrl?: string;
  status: 'PRODUCTION' | 'PROTOTYPE' | 'BENCHMARKED';
  stats: { label: string; value: string }[];
}

export interface SkillNode {
  id: string;
  name: string;
  category: 'Backend & Go' | 'AI & Inference' | 'AI & PyTorch' | 'WebGL & Shaders' | 'Systems & Low-Level' | 'Infra & Polyglot';
  proficiency: number; // 0 - 100
  position: [number, number, number];
  connections: string[]; // Node IDs connected
  description: string;
  coreStrengths: string[];
  metrics: string;
  accentColor: string;
}

export interface TerminalLog {
  id: string;
  type: 'input' | 'output' | 'error' | 'system' | 'success';
  content: string;
  timestamp: string;
}

export interface TelemetryMetrics {
  fps: number;
  memoryUsageMb: number;
  activeDrawCalls: number;
  networkLatencyMs: number;
  quantumEntropy: number;
  uptimeSeconds: number;
}

export interface ContactPayload {
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
  telemetryMetadata: {
    browserAgent: string;
    timestamp: string;
    sessionState: AppState;
  };
}
