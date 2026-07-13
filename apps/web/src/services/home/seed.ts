import type {
  AnnouncementItem,
  FaqItem,
  GalleryItem,
  HomeEvent,
  HomeStatistics,
  LeaderboardEntry,
  RegistrationProgress,
  SponsorItem,
  TestimonialItem,
  ThemeItem,
} from "@/types/home";

export const homeEventSeed: HomeEvent = {
  id: "hackos-2026",
  name: "HackOS",
  logo: "/brand/hackos.svg",
  description:
    "The HackOS IoT Innovation Hackathon is a research-driven platform for students, innovators, engineers, researchers, startups, and industry professionals.",
  tagline: "The Future of Innovation Starts Here",
  venue: "Hybrid — Campus Innovation Hall + Online",
  startsAt: "2026-08-15T09:00:00.000Z",
  endsAt: "2026-08-17T18:00:00.000Z",
  registrationDeadline: "2026-08-01T18:30:00.000Z",
  capacity: 1000,
  filled: 720,
  registrationStatus: "open",
  prizePool: 500000,
};

export const homeStatisticsSeed: HomeStatistics = {
  participants: 2500,
  teams: 600,
  mentors: 42,
  judges: 18,
  sponsors: 15,
  countries: 5,
  prizePool: 500000,
  visitors: 4820,
  currentlyOnline: 312,
  liveTeams: 148,
  projectsStarted: 96,
  mentorSessions: 41,
  questionsAnswered: 287,
  componentsIssued: 620,
  announcementsToday: 7,
  activeVolunteers: 28,
};

export const homeLeaderboardSeed: LeaderboardEntry[] = [
  { rank: 1, name: "Team Quantum", xp: 920, track: "AI", achievements: ["Daily streak"] },
  { rank: 2, name: "Team Aura", xp: 890, track: "IoT", achievements: ["Quiz ace"] },
  { rank: 3, name: "Team Vision", xp: 870, track: "Edge", achievements: ["Game master"] },
  { rank: 4, name: "Team Orbit", xp: 840, track: "Cyber" },
  { rank: 5, name: "Team Nexus", xp: 810, track: "Energy" },
  { rank: 6, name: "Circuit Wolves", xp: 795, track: "Smart Cities" },
  { rank: 7, name: "Neon Flux", xp: 780, track: "AI" },
  { rank: 8, name: "Packet Ghosts", xp: 760, track: "Industrial" },
  { rank: 9, name: "Latency Zero", xp: 740, track: "Edge" },
  { rank: 10, name: "Quantum Nest", xp: 720, track: "Healthcare" },
];

export const homeThemesSeed: ThemeItem[] = [
  {
    id: "industrial",
    title: "Industrial Automation",
    description:
      "Develop smart industrial monitoring systems, predictive maintenance solutions, and intelligent manufacturing automation.",
    difficulty: "Advanced",
    icon: "factory",
    status: "active",
    technologies: ["PLC", "MQTT", "Raspberry Pi", "ESP32", "SCADA", "Node-RED"],
    sampleProjects: [
      "Predictive vibration monitor for CNC lines",
      "Digital twin of a packaging cell",
    ],
    architecture:
      "Edge sensors → gateway → MQTT broker → Node-RED/SCADA → cloud analytics.",
    hardware: ["ESP32", "Raspberry Pi 4", "Industrial sensors"],
    resources: [{ label: "MQTT Essentials", href: "https://mqtt.org/" }],
  },
  {
    id: "agriculture",
    title: "Smart Agriculture",
    description:
      "Build sensing and decision systems for soil health, irrigation, and crop yield optimization.",
    difficulty: "Intermediate",
    icon: "leaf",
    status: "active",
    technologies: ["Soil Sensors", "LoRaWAN", "AI Crop Monitoring", "Weather Prediction"],
    sampleProjects: ["LoRa soil moisture mesh", "Vision-based pest early warning"],
    architecture: "Field sensors → LoRaWAN gateway → cloud ingest → ML models.",
    hardware: ["Soil NPK probes", "LoRa nodes", "Camera module"],
    resources: [{ label: "LoRaWAN overview", href: "https://lora-alliance.org/" }],
  },
  {
    id: "healthcare",
    title: "Healthcare IoT",
    description:
      "Design patient monitoring, remote healthcare, smart medical devices, and wearables.",
    difficulty: "Advanced",
    icon: "heart",
    status: "active",
    technologies: ["BLE", "Wearables", "Edge AI", "Cloud EHR hooks"],
    sampleProjects: ["Remote vitals wearable", "Smart pill adherence tracker"],
    architecture: "Wearable BLE → gateway → secure API → clinician dashboard.",
    hardware: ["Pulse oximeter modules", "IMU", "ESP32-C3"],
    resources: [{ label: "OpenCV", href: "https://opencv.org/" }],
  },
  {
    id: "cities",
    title: "Smart Cities",
    description:
      "Traffic monitoring, smart parking, waste management, and environmental sensing.",
    difficulty: "Intermediate",
    icon: "building",
    status: "active",
    technologies: ["Computer Vision", "MQTT", "GIS", "NB-IoT"],
    sampleProjects: ["Adaptive traffic assist", "Ultrasonic smart parking"],
    architecture: "City sensors → edge inference → municipal ops console.",
    hardware: ["Camera nodes", "Ultrasonic sensors", "RPi"],
    resources: [{ label: "Smart city patterns", href: "#resources" }],
  },
  {
    id: "energy",
    title: "Energy Management",
    description:
      "Solar monitoring, smart grid analytics, power quality, and energy optimization.",
    difficulty: "Intermediate",
    icon: "sun",
    status: "active",
    technologies: ["Modbus", "MQTT", "Power Analytics", "Dashboards"],
    sampleProjects: ["Rooftop solar twin", "Campus load-shedding advisor"],
    architecture: "Meters → gateway → time-series DB → optimization services.",
    hardware: ["Current clamps", "Smart meters", "RPi"],
    resources: [{ label: "Docker deploy guide", href: "#resources" }],
  },
  {
    id: "ai-iot",
    title: "AI + IoT",
    description:
      "Computer vision, edge AI, predictive analytics, and digital twins on constrained devices.",
    difficulty: "Advanced",
    icon: "zap",
    status: "active",
    technologies: ["Computer Vision", "Edge AI", "Predictive Analytics", "Digital Twins"],
    sampleProjects: ["On-device defect detection", "Predictive maintenance twin"],
    architecture: "Sensors → edge accelerator → model registry → twin UI.",
    hardware: ["Hailo / Jetson", "USB cams", "ESP32-S3"],
    resources: [
      { label: "TensorFlow Lite", href: "https://www.tensorflow.org/lite" },
    ],
  },
];

export const homeAnnouncementsSeed: AnnouncementItem[] = [
  {
    id: "a1",
    title: "Workshop starts at 10:00 AM",
    message: "On-device ML clinic in Hall A.",
    priority: "high",
    publishedAt: new Date().toISOString(),
  },
  {
    id: "a2",
    title: "New sponsor announced",
    message: "Welcome our latest Platinum partner.",
    priority: "normal",
    publishedAt: new Date().toISOString(),
  },
  {
    id: "a3",
    title: "Problem statements released",
    message: "Featured challenges are live on the home page.",
    priority: "high",
    publishedAt: new Date().toISOString(),
  },
  {
    id: "a4",
    title: "Registration deadline extended",
    message: "Seats remain — register before capacity closes.",
    priority: "high",
    publishedAt: new Date().toISOString(),
  },
];

export const homeGallerySeed: GalleryItem[] = [
  {
    id: "g1",
    title: "Hardware Lab",
    type: "Photos",
    theme: "Industrial IoT",
    college: "NIT",
    tech: "ESP32",
    award: "Winner",
    year: "2025",
    caption: "Teams assembling sensor nodes",
    tags: ["lab", "hardware"],
    tone: "from-sky-500/30 to-cyan-500/5",
  },
  {
    id: "g2",
    title: "Pitch Arena",
    type: "Videos",
    theme: "AI + IoT",
    college: "State Tech",
    tech: "Python",
    award: "Runner-up",
    year: "2025",
    caption: "Finals stage demos",
    tags: ["pitch", "finals"],
    tone: "from-violet-500/30 to-fuchsia-500/5",
  },
  {
    id: "g3",
    title: "PCB Close-up",
    type: "PCB Images",
    theme: "Healthcare",
    college: "Metro Eng",
    tech: "STM32",
    award: "Track",
    year: "2024",
    caption: "Wearable board revision B",
    tags: ["pcb"],
    tone: "from-emerald-500/25 to-teal-500/5",
  },
  {
    id: "g4",
    title: "CAD Housing",
    type: "CAD Models",
    theme: "Agriculture",
    college: "NIT",
    tech: "LoRa",
    award: "Special",
    year: "2024",
    caption: "Field enclosure design",
    tags: ["cad"],
    tone: "from-amber-500/20 to-orange-500/5",
  },
  {
    id: "g5",
    title: "Circuit Diagram",
    type: "Circuit Designs",
    theme: "Energy",
    college: "State Tech",
    tech: "MQTT",
    award: "—",
    year: "2025",
    caption: "Metering gateway schematic",
    tags: ["circuit"],
    tone: "from-blue-500/25 to-indigo-500/5",
  },
  {
    id: "g6",
    title: "Finals Deck",
    type: "Presentations",
    theme: "Smart Cities",
    college: "Metro Eng",
    tech: "OpenCV",
    award: "Third",
    year: "2023",
    caption: "Judging presentation slides",
    tags: ["slides"],
    tone: "from-rose-500/20 to-pink-500/5",
  },
];

export const homeFaqSeed: FaqItem[] = [
  {
    id: "f1",
    question: "Who can participate?",
    answer:
      "Students, early-career engineers, and makers with interest in IoT, AI, embedded, or cybersecurity.",
    category: "Eligibility",
  },
  {
    id: "f2",
    question: "What is the team size?",
    answer:
      "Teams of 2–4. Solo builders can join the matching lobby after registration.",
    category: "Teams",
  },
  {
    id: "f3",
    question: "Is hardware provided?",
    answer:
      "Yes. Organizers distribute kits via the volunteer desk. Bring your laptop and chargers.",
    category: "Hardware",
  },
  {
    id: "f4",
    question: "How does judging work?",
    answer:
      "Live scorecards across innovation, technical complexity, presentation, scalability, impact, UI, and business value.",
    category: "Judging",
  },
];

export const homeSponsorsSeed: SponsorItem[] = [
  {
    id: "s1",
    name: "NVIDIA Jetson",
    category: "Platinum",
    website: "https://developer.nvidia.com/embedded-computing",
    description: "Edge AI compute for vision and robotics tracks.",
    careers: "Internships in embedded AI",
    challenges: "Edge Vision Challenge",
  },
  {
    id: "s2",
    name: "Arduino",
    category: "Platinum",
    website: "https://www.arduino.cc/",
    description: "Prototyping hardware and education kits.",
    careers: "Maker educator roles",
    challenges: "Rapid Prototype Award",
  },
  {
    id: "s3",
    name: "Espressif",
    category: "Gold",
    website: "https://www.espressif.com/",
    description: "ESP32 platforms for connected devices.",
    careers: "Firmware engineering",
    challenges: "Connectivity Challenge",
  },
  {
    id: "s4",
    name: "GitHub",
    category: "Silver",
    website: "https://github.com/",
    description: "Repos, CI, and collaboration for every team.",
    careers: "Student developer pack",
    challenges: "Open Source Excellence",
  },
  {
    id: "s5",
    name: "Edge Impulse",
    category: "Technology",
    website: "https://www.edgeimpulse.com/",
    description: "TinyML tooling for on-device intelligence.",
    careers: "ML engineer pathways",
    challenges: "TinyML Spotlight",
  },
  {
    id: "s6",
    name: "IoT Lab Community",
    category: "Community",
    website: "#contact",
    description: "Campus makers supporting hardware desks.",
    careers: "Volunteer leadership",
    challenges: "Community Impact Badge",
  },
];

export const homeTestimonialsSeed: TestimonialItem[] = [
  {
    id: "t1",
    name: "Ananya Rao",
    role: "Team Lead",
    college: "NIT Innovation Campus",
    quote:
      "The mentorship completely changed how we approached product development.",
    rating: 5,
    initials: "AR",
  },
  {
    id: "t2",
    name: "Dev Patel",
    role: "Participant",
    college: "State Tech University",
    quote:
      "Live leaderboard pressure made us ship a working mesh before finals.",
    rating: 5,
    initials: "DP",
  },
  {
    id: "t3",
    name: "Priya Nair",
    role: "Sponsor Liaison",
    college: "Industry Partner",
    quote:
      "Judging scorecards were transparent — sponsors got audience data that mattered.",
    rating: 5,
    initials: "PN",
  },
];

export function toRegistrationProgress(event: HomeEvent): RegistrationProgress {
  const percent = Math.min(
    100,
    Math.round((event.filled / event.capacity) * 100),
  );
  return {
    filled: event.filled,
    capacity: event.capacity,
    percent,
    status:
      percent >= 100
        ? "closed"
        : percent > 90
          ? "nearly_full"
          : "open",
  };
}
