"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CircuitBoard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackAnalytics } from "@/hooks/use-analytics";

export function CTAButtons({ isLive }: { isLive?: boolean }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="mt-8 flex flex-wrap gap-3"
    >
      <Link
        href={isLive ? "/dashboard" : "/register"}
        onClick={() =>
          trackAnalytics("hero_cta_clicked", {
            label: isLive ? "join_live" : "register",
          })
        }
      >
        <Button size="lg" className="cta-primary">
          {isLive ? "Join Live Event" : "Register Now"}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </Link>
      <a href="#tracks">
        <Button variant="secondary" size="lg">
          <CircuitBoard className="h-4 w-4" aria-hidden />
          Explore Tracks
        </Button>
      </a>
    </motion.div>
  );
}
