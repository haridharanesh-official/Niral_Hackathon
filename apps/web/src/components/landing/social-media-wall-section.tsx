"use client";

import { useEffect, useState } from "react";
import { Heart, Share2 } from "lucide-react";

type Post = {
  platform: "Instagram" | "LinkedIn" | "YouTube" | "X";
  author: string;
  text: string;
  likes: number;
  shares: number;
};

const seed: Post[] = [
  {
    platform: "Instagram",
    author: "@hackos.lab",
    text: "Hardware desks are buzzing — kit check-ins now open.",
    likes: 214,
    shares: 38,
  },
  {
    platform: "LinkedIn",
    author: "HackOS Official",
    text: "Proud to welcome our Platinum partners for Edge AI tracks.",
    likes: 482,
    shares: 91,
  },
  {
    platform: "YouTube",
    author: "HackOS Streams",
    text: "Workshop replay: MQTT for industrial gateways.",
    likes: 1203,
    shares: 156,
  },
  {
    platform: "X",
    author: "@hackos",
    text: "Problem statements dropped. Tag your team build thread.",
    likes: 670,
    shares: 204,
  },
];

export function SocialMediaWallSection() {
  const [posts, setPosts] = useState(seed);

  useEffect(() => {
    const id = window.setInterval(() => {
      setPosts((prev) =>
        prev.map((p) => ({
          ...p,
          likes: p.likes + Math.floor(Math.random() * 4),
          shares: p.shares + (Math.random() > 0.7 ? 1 : 0),
        })),
      );
    }, 5000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section id="social" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="font-display text-3xl font-bold text-white">
          Social Media Wall
        </h2>
        <p className="mt-3 max-w-xl text-muted">
          Community activity across Instagram, LinkedIn, YouTube, and X — auto refresh.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {posts.map((post) => (
            <article
              key={post.platform}
              className="rounded-3xl border border-white/8 bg-white/[0.03] p-5"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-sky-300">
                {post.platform}
              </p>
              <p className="mt-2 text-sm text-muted">{post.author}</p>
              <p className="mt-3 text-sm leading-relaxed text-foreground/90">
                {post.text}
              </p>
              <div className="mt-4 flex gap-4 text-sm text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Heart className="h-3.5 w-3.5 text-rose-300" aria-hidden />
                  {post.likes.toLocaleString("en-IN")}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Share2 className="h-3.5 w-3.5 text-sky-300" aria-hidden />
                  {post.shares.toLocaleString("en-IN")}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
