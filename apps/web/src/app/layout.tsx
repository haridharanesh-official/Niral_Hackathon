import type { Metadata } from "next";
import { APP_NAME, APP_TAGLINE } from "@hackos/shared";
import { Providers } from "@/components/providers";
import "@fontsource/orbitron/500.css";
import "@fontsource/orbitron/700.css";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://niralhackathon.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${APP_NAME} — IoT Hackathon & Innovation Challenge`,
    template: `%s · ${APP_NAME}`,
  },
  description:
    "Join Niral Hackathon — a student IoT hackathon and AI + IoT innovation challenge with live rankings, embedded systems tracks, mentors, and workshops.",
  keywords: [
    "IoT Hackathon",
    "Innovation Challenge",
    "Student Hackathon",
    "Embedded Systems Competition",
    "AI + IoT Event",
    "Niral Hackathon",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    title: `${APP_NAME} — ${APP_TAGLINE}`,
    description:
      "Register for Niral Hackathon: IoT, AI, robotics, and embedded systems hackathon with live leaderboards and mentors.",
    siteName: APP_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — ${APP_TAGLINE}`,
    description:
      "Student IoT hackathon and AI + IoT innovation challenge. Build. Innovate. Compete.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const eventJsonLd = {
  "@context": "https://schema.org",
  "@type": "Event",
  name: "Niral Hackathon — IoT Innovation Challenge",
  description:
    "Research-driven IoT + AI hackathon for students, innovators, and industry professionals.",
  startDate: "2026-08-15T09:00:00+05:30",
  endDate: "2026-08-17T18:00:00+05:30",
  eventAttendanceMode: "https://schema.org/MixedEventAttendanceMode",
  eventStatus: "https://schema.org/EventScheduled",
  location: {
    "@type": "Place",
    name: "Campus Innovation Hall",
    address: "Hybrid — Campus + Online",
  },
  organizer: {
    "@type": "Organization",
    name: APP_NAME,
    url: siteUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" data-theme="light">
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
