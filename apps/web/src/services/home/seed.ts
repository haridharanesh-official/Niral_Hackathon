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
  id: "niral-2026",
  name: "NIRAL Hackathon 2026",
  logo: "/brand/hackos.svg",
  description:
    "NIRAL Hackathon 2026 is an innovation-driven IoT and emerging technologies platform for students, researchers, makers, and innovators.",
  tagline: "The Future of Innovation Starts Here",
  venue: "Sri Shakthi Institute of Engineering and Technology",
  startsAt: "2026-12-03T00:00:00.000Z",
  endsAt: "2026-12-04T23:59:59.000Z",
  registrationDeadline: "TBA",
  capacity: 0,
  filled: 0,
  registrationStatus: "closed",
  prizePool: 0,
};

export const homeStatisticsSeed: HomeStatistics = {
  participants: 0,
  teams: 0,
  mentors: 0,
  judges: 0,
  sponsors: 0,
  countries: 0,
  prizePool: 0,
  visitors: 0,
  currentlyOnline: 0,
  liveTeams: 0,
  projectsStarted: 0,
  mentorSessions: 0,
  questionsAnswered: 0,
  componentsIssued: 0,
  announcementsToday: 0,
  activeVolunteers: 0,
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
    title: "NIRAL Hackathon 2026 dates confirmed: December 3–4, 2026",
    message: "Join us at Sri Shakthi Institute of Engineering and Technology.",
    priority: "high",
    publishedAt: new Date().toISOString(),
  },
  {
    id: "a2",
    title: "Pre-registration is now open — register your team today",
    message: "Open to students, developers, and innovators across India.",
    priority: "normal",
    publishedAt: new Date().toISOString(),
  },
  {
    id: "a3",
    title: "Organized by IoT Club, Sri Shakthi Institute of Engineering and Technology",
    message: "Official Contact: iotclub.siet@gmail.com | 8508511975",
    priority: "high",
    publishedAt: new Date().toISOString(),
  },
  {
    id: "a4",
    title: "Detailed problem statements & hardware catalog coming soon",
    message: "Official challenge releases will be published ahead of the event.",
    priority: "normal",
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

export const homeSponsorsSeed: SponsorItem[] = [];

export const homeTestimonialsSeed: TestimonialItem[] = [];

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
