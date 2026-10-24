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

import {
  homeAnnouncementsSeed,
  homeEventSeed,
  homeFaqSeed,
  homeGallerySeed,
  homeLeaderboardSeed,
  homeSponsorsSeed,
  homeStatisticsSeed,
  homeTestimonialsSeed,
  homeThemesSeed,
  toRegistrationProgress,
} from "@/services/home/seed";

export interface PrizeItem {
  place: string;
  amount: string;
  perks: string[];
  highlight: boolean;
}

export interface TimelineItem {
  title: string;
  date: string;
  time: string;
  venue: string;
  description: string;
}

export interface WhyReasonItem {
  title: string;
  blurb: string;
}

export interface TechItem {
  name: string;
  blurb: string;
  href: string;
}

export interface CheckinParticipant {
  id: string;
  ticketCode: string;
  name: string;
  email: string;
  teamName: string;
  track: string;
  college: string;
  checkedIn: boolean;
  checkedInAt?: string | null;
  badgePrinted: boolean;
  dietary?: string;
  tshirtSize: string;
  role: "PARTICIPANT" | "TEAM_LEADER" | "MENTOR" | "JUDGE" | "VIP";
}

export interface EventTask {
  id: string;
  title: string;
  category: "Venue & Stage" | "Hardware Desk" | "Catering & Logistics" | "Mentor Clinics" | "Judging" | "Network & Infra";
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status: "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED";
  assignee: string;
  dueTime: string;
}

export interface HardwareInventoryItem {
  id: string;
  name: string;
  sku: string;
  category: "MCU / SBC" | "Sensors" | "Communication" | "Power & Tools";
  total: number;
  loaned: number;
  available: number;
  depositRequired: boolean;
}

export interface JudgingRoundConfig {
  currentRound: "ROUND_1_SCREENING" | "SEMI_FINALS" | "GRAND_FINALE" | "COMPLETED";
  isScoringLocked: boolean;
  rubricWeights: {
    innovation: number;
    technicalDepth: number;
    scalability: number;
    presentation: number;
    businessImpact: number;
  };
  assignedJudgesCount: number;
  totalSubmissions: number;
  evaluatedSubmissions: number;
}

export interface TrackDistribution {
  track: string;
  teamsCount: number;
  participantsCount: number;
  color: string;
}

export interface CheckinVelocity {
  hour: string;
  count: number;
}

export interface AppContentData {
  event: HomeEvent;
  statistics: HomeStatistics;
  emergencyBanner: {
    enabled: boolean;
    message: string;
    level?: "normal" | "warning" | "critical";
  };
  announcements: AnnouncementItem[];
  themes: ThemeItem[];
  faqs: FaqItem[];
  prizes: PrizeItem[];
  timeline: TimelineItem[];
  whyReasons: WhyReasonItem[];
  technologies: TechItem[];
  sponsors: SponsorItem[];
  testimonials: TestimonialItem[];
  gallery: GalleryItem[];
  leaderboard: LeaderboardEntry[];
  registration: RegistrationProgress;
  // Event Operations & Checkin
  checkinList: CheckinParticipant[];
  eventTasks: EventTask[];
  hardwareInventory: HardwareInventoryItem[];
  judgingConfig: JudgingRoundConfig;
  trackDistribution: TrackDistribution[];
  checkinVelocity: CheckinVelocity[];
}

export const initialDefaultContent: AppContentData = {
  event: homeEventSeed,
  statistics: homeStatisticsSeed,
  emergencyBanner: {
    enabled: false,
    message: "Notice: Official updates for NIRAL Hackathon 2026 will be published here by the IoT Club organizing desk.",
    level: "warning",
  },
  announcements: homeAnnouncementsSeed,
  themes: homeThemesSeed,
  faqs: homeFaqSeed,
  prizes: [
    {
      place: "Grand Champion",
      amount: "Coming Soon",
      perks: ["Trophy + Certificates", "Incubation opportunity", "Hardware awards"],
      highlight: true,
    },
    {
      place: "Runner Up",
      amount: "Coming Soon",
      perks: ["Certificates", "Mentorship access", "Tech credits"],
      highlight: false,
    },
    {
      place: "Track Winners",
      amount: "Coming Soon",
      perks: ["Track Certificates", "Innovation Kits", "Community Recognition"],
      highlight: false,
    },
  ],
  timeline: [
    {
      title: "NIRAL Hackathon 2026 — Day 1",
      date: "Dec 3, 2026",
      time: "Schedule TBA",
      venue: "Sri Shakthi Institute of Engineering and Technology",
      description: "Opening keynote, team check-ins, and hackathon kickoff. Exact session timings will be announced by organizers.",
    },
    {
      title: "NIRAL Hackathon 2026 — Day 2",
      date: "Dec 4, 2026",
      time: "Schedule TBA",
      venue: "Sri Shakthi Institute of Engineering and Technology",
      description: "Project development, mentorship rounds, submission deadline, project presentations, and awards.",
    },
  ],
  whyReasons: [
    {
      title: "Build Real Products",
      blurb: "Develop solutions addressing real-world challenges using cutting-edge technologies.",
    },
    {
      title: "Industry Mentorship",
      blurb: "Receive one-on-one guidance from experienced engineers, researchers, and entrepreneurs.",
    },
    {
      title: "Networking",
      blurb: "Collaborate with peers, industry experts, startups, and sponsors.",
    },
    {
      title: "Internships",
      blurb: "Outstanding participants gain opportunities for internships and recruitment.",
    },
    {
      title: "Cash Prizes",
      blurb: "Compete for substantial prize money and exclusive sponsor rewards.",
    },
    {
      title: "Certificates",
      blurb: "Receive digitally verifiable participation and achievement certificates.",
    },
  ],
  technologies: [
    {
      name: "Arduino",
      blurb: "Rapid prototyping boards for sensors and actuators.",
      href: "https://docs.arduino.cc/",
    },
    {
      name: "Raspberry Pi",
      blurb: "Linux SBC for gateways, vision, and edge services.",
      href: "https://www.raspberrypi.com/documentation/",
    },
    {
      name: "ESP32",
      blurb: "Wi-Fi/BLE MCU family for connected edge nodes.",
      href: "https://docs.espressif.com/projects/esp-idf/",
    },
    {
      name: "STM32",
      blurb: "High-performance MCUs for industrial and robotics.",
      href: "https://www.st.com/en/microcontrollers-microprocessors/stm32-32-bit-arm-cortex-mcus.html",
    },
    {
      name: "MQTT",
      blurb: "Lightweight pub/sub messaging for IoT fleets.",
      href: "https://mqtt.org/",
    },
    {
      name: "LoRa",
      blurb: "Long-range, low-power wide area connectivity.",
      href: "https://lora-alliance.org/",
    },
    {
      name: "Node-RED",
      blurb: "Flow-based wiring of hardware, APIs, and dashboards.",
      href: "https://nodered.org/docs/",
    },
    {
      name: "Python",
      blurb: "Scripting, analytics, and ML glue for prototypes.",
      href: "https://docs.python.org/3/",
    },
  ],
  sponsors: homeSponsorsSeed,
  testimonials: homeTestimonialsSeed,
  gallery: homeGallerySeed,
  leaderboard: homeLeaderboardSeed,
  registration: toRegistrationProgress(homeEventSeed),

  // Checkin terminal seed
  checkinList: [
    {
      id: "chk-01",
      ticketCode: "HOS-9401",
      name: "Aarav Sharma",
      email: "aarav@quantum.dev",
      teamName: "Team Quantum",
      track: "Industrial Automation",
      college: "IIT Bombay",
      checkedIn: true,
      checkedInAt: "08:45 AM",
      badgePrinted: true,
      dietary: "Vegetarian",
      tshirtSize: "L",
      role: "TEAM_LEADER",
    },
    {
      id: "chk-02",
      ticketCode: "HOS-9402",
      name: "Diya Venkatesh",
      email: "diya@quantum.dev",
      teamName: "Team Quantum",
      track: "Industrial Automation",
      college: "IIT Bombay",
      checkedIn: true,
      checkedInAt: "08:52 AM",
      badgePrinted: true,
      dietary: "Vegan",
      tshirtSize: "M",
      role: "PARTICIPANT",
    },
    {
      id: "chk-03",
      ticketCode: "HOS-9403",
      name: "Rohan Kulkarni",
      email: "rohan@aura.io",
      teamName: "Team Aura",
      track: "Smart Agriculture",
      college: "BITS Pilani",
      checkedIn: true,
      checkedInAt: "09:10 AM",
      badgePrinted: false,
      dietary: "Standard",
      tshirtSize: "XL",
      role: "TEAM_LEADER",
    },
    {
      id: "chk-04",
      ticketCode: "HOS-9404",
      name: "Sanya Gupta",
      email: "sanya@aura.io",
      teamName: "Team Aura",
      track: "Smart Agriculture",
      college: "BITS Pilani",
      checkedIn: false,
      checkedInAt: null,
      badgePrinted: false,
      dietary: "Vegetarian",
      tshirtSize: "S",
      role: "PARTICIPANT",
    },
    {
      id: "chk-05",
      ticketCode: "HOS-9405",
      name: "Kabir Mehta",
      email: "kabir@vision.tech",
      teamName: "Team Vision",
      track: "Healthcare IoT",
      college: "NIT Surathkal",
      checkedIn: true,
      checkedInAt: "09:25 AM",
      badgePrinted: true,
      dietary: "Standard",
      tshirtSize: "M",
      role: "TEAM_LEADER",
    },
    {
      id: "chk-06",
      ticketCode: "HOS-9406",
      name: "Dr. Vikram Sethi",
      email: "vikram@iotlabs.org",
      teamName: "Faculty / Advisor",
      track: "Edge Intelligence",
      college: "Industry Mentor",
      checkedIn: true,
      checkedInAt: "08:15 AM",
      badgePrinted: true,
      dietary: "Vegetarian",
      tshirtSize: "L",
      role: "MENTOR",
    },
    {
      id: "chk-07",
      ticketCode: "HOS-9407",
      name: "Elena Rostova",
      email: "elena@cyber.io",
      teamName: "Packet Ghosts",
      track: "Industrial Automation",
      college: "DTU Delhi",
      checkedIn: false,
      checkedInAt: null,
      badgePrinted: false,
      dietary: "Vegan",
      tshirtSize: "M",
      role: "PARTICIPANT",
    },
    {
      id: "chk-08",
      ticketCode: "HOS-9408",
      name: "Prof. Arvind Raman",
      email: "arvind@ieee.org",
      teamName: "Jury Panel A",
      track: "All Tracks",
      college: "IEEE Fellow",
      checkedIn: true,
      checkedInAt: "09:30 AM",
      badgePrinted: true,
      dietary: "Standard",
      tshirtSize: "XL",
      role: "JUDGE",
    },
  ],

  // Event Manager Task Board
  eventTasks: [
    {
      id: "task-01",
      title: "Verify Wi-Fi 6 AP roaming coverage across Hall B & C",
      category: "Network & Infra",
      priority: "CRITICAL",
      status: "DONE",
      assignee: "Alex (Infra Lead)",
      dueTime: "08:00 AM",
    },
    {
      id: "task-02",
      title: "Deploy 50x ESP32-S3 boards & power banks to hardware desk",
      category: "Hardware Desk",
      priority: "CRITICAL",
      status: "DONE",
      assignee: "Hardware Team",
      dueTime: "08:30 AM",
    },
    {
      id: "task-03",
      title: "Check-in desk registration badge barcode printer calibration",
      category: "Venue & Stage",
      priority: "HIGH",
      status: "DONE",
      assignee: "Priya (Volunteer)",
      dueTime: "08:45 AM",
    },
    {
      id: "task-04",
      title: "Mentor clinic matching lobby room rotation setup",
      category: "Mentor Clinics",
      priority: "HIGH",
      status: "IN_PROGRESS",
      assignee: "Siddharth",
      dueTime: "11:30 AM",
    },
    {
      id: "task-05",
      title: "Coordinate lunch buffet delivery for 800+ hackers & judges",
      category: "Catering & Logistics",
      priority: "HIGH",
      status: "IN_PROGRESS",
      assignee: "Operations Lead",
      dueTime: "12:45 PM",
    },
    {
      id: "task-06",
      title: "Distribute preliminary evaluation rubrics to Judge Panel",
      category: "Judging",
      priority: "MEDIUM",
      status: "TODO",
      assignee: "Academic Chair",
      dueTime: "02:00 PM",
    },
    {
      id: "task-07",
      title: "Prepare live stream backup recording for keynotes",
      category: "Venue & Stage",
      priority: "MEDIUM",
      status: "TODO",
      assignee: "Media Crew",
      dueTime: "03:30 PM",
    },
  ],

  // Hardware Inventory Tracker
  hardwareInventory: [
    {
      id: "hw-01",
      name: "ESP32-S3 Wi-Fi/BLE AI Dev Board",
      sku: "ESP32-S3-WROOM-1",
      category: "MCU / SBC",
      total: 120,
      loaned: 94,
      available: 26,
      depositRequired: false,
    },
    {
      id: "hw-02",
      name: "Raspberry Pi 4 Model B (8GB RAM)",
      sku: "RPI4-8GB-KIT",
      category: "MCU / SBC",
      total: 45,
      loaned: 38,
      available: 7,
      depositRequired: true,
    },
    {
      id: "hw-03",
      name: "LoRaWAN 868MHz Gateway + Node Kit",
      sku: "SX1302-LORA-MESH",
      category: "Communication",
      total: 30,
      loaned: 22,
      available: 8,
      depositRequired: true,
    },
    {
      id: "hw-04",
      name: "Industrial Modbus/RS485 Sensor Pack",
      sku: "IND-MODBUS-5X",
      category: "Sensors",
      total: 40,
      loaned: 31,
      available: 9,
      depositRequired: false,
    },
    {
      id: "hw-05",
      name: "Thermal Infrared Camera Sensor (MLX90640)",
      sku: "MLX-THERM-32X24",
      category: "Sensors",
      total: 25,
      loaned: 19,
      available: 6,
      depositRequired: true,
    },
    {
      id: "hw-06",
      name: "Digital Multimeter & USB Logic Analyzer Kit",
      sku: "ANALYZER-24M-8CH",
      category: "Power & Tools",
      total: 50,
      loaned: 35,
      available: 15,
      depositRequired: false,
    },
  ],

  // Judging & Rubric Config
  judgingConfig: {
    currentRound: "ROUND_1_SCREENING",
    isScoringLocked: false,
    rubricWeights: {
      innovation: 30,
      technicalDepth: 25,
      scalability: 15,
      presentation: 15,
      businessImpact: 15,
    },
    assignedJudgesCount: 18,
    totalSubmissions: 96,
    evaluatedSubmissions: 42,
  },

  // Detailed Statistical Analytics
  trackDistribution: [
    { track: "Industrial Automation", teamsCount: 168, participantsCount: 610, color: "#38bdf8" },
    { track: "Smart Agriculture", teamsCount: 142, participantsCount: 520, color: "#34d399" },
    { track: "Healthcare IoT", teamsCount: 125, participantsCount: 460, color: "#f43f5e" },
    { track: "Edge Intelligence", teamsCount: 104, participantsCount: 395, color: "#a855f7" },
    { track: "Smart Cities & Mobility", teamsCount: 61, participantsCount: 245, color: "#f59e0b" },
  ],

  checkinVelocity: [
    { hour: "08:00 AM", count: 85 },
    { hour: "08:30 AM", count: 160 },
    { hour: "09:00 AM", count: 240 },
    { hour: "09:30 AM", count: 180 },
    { hour: "10:00 AM", count: 55 },
  ],
};

// Global in-memory storage on server
declare global {
  // eslint-disable-next-line no-var
  var __HACKOS_CONTENT__: AppContentData | undefined;
}

export function getContentStore(): AppContentData {
  if (!global.__HACKOS_CONTENT__) {
    global.__HACKOS_CONTENT__ = JSON.parse(JSON.stringify(initialDefaultContent));
  }
  return global.__HACKOS_CONTENT__!;
}

export function updateContentStore(partial: Partial<AppContentData>): AppContentData {
  const current = getContentStore();
  global.__HACKOS_CONTENT__ = {
    ...current,
    ...partial,
  };
  return global.__HACKOS_CONTENT__!;
}

export function resetContentStore(): AppContentData {
  global.__HACKOS_CONTENT__ = JSON.parse(JSON.stringify(initialDefaultContent));
  return global.__HACKOS_CONTENT__!;
}
