"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type QuizSummary = {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  difficulty: string;
  timeLimit: number;
  xpReward: number;
  _count?: { questions: number };
};

type QuizPlay = {
  id: string;
  title: string;
  timeLimit: number;
  questions: Array<{
    id: string;
    prompt: string;
    options: string[];
    points: number;
  }>;
};

export default function QuizArenaPage() {
  const { data: session } = useSession();
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [active, setActive] = useState<QuizPlay | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${apiUrl}/api/quizzes`)
      .then(async (res) => {
        if (!res.ok) throw new Error("API unavailable");
        return res.json();
      })
      .then(setQuizzes)
      .catch(() =>
        setError(
          "Quiz API offline — start Postgres + API, then refresh. Demo list shown below.",
        ),
      );
  }, []);

  const demoFallback: QuizSummary[] = [
    {
      id: "demo-iot",
      title: "IoT Fundamentals",
      description: "Sensors, protocols, and edge basics",
      category: "IOT",
      difficulty: "EASY",
      timeLimit: 300,
      xpReward: 40,
      _count: { questions: 3 },
    },
    {
      id: "demo-ai",
      title: "AI Quickfire",
      description: "Model basics for hackathon builders",
      category: "AI",
      difficulty: "MEDIUM",
      timeLimit: 360,
      xpReward: 60,
      _count: { questions: 2 },
    },
  ];

  const list = quizzes.length ? quizzes : demoFallback;

  async function startQuiz(id: string) {
    setResult(null);
    if (id.startsWith("demo-")) {
      setActive({
        id,
        title: id.includes("ai") ? "AI Quickfire" : "IoT Fundamentals",
        timeLimit: 300,
        questions: [
          {
            id: "q1",
            prompt: "Which protocol is common for constrained IoT devices?",
            options: ["MQTT", "FTP", "SMTP", "SSH"],
            points: 10,
          },
          {
            id: "q2",
            prompt: "What does ADC convert?",
            options: [
              "Analog to Digital",
              "Audio to Data",
              "Address to Device",
              "Amp to Decibel",
            ],
            points: 10,
          },
        ],
      });
      setAnswers({});
      return;
    }

    const res = await fetch(`${apiUrl}/api/quizzes/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setActive({
      ...data,
      questions: data.questions.map(
        (q: { id: string; prompt: string; options: unknown; points: number }) => ({
          ...q,
          options: Array.isArray(q.options) ? q.options : [],
        }),
      ),
    });
    setAnswers({});
  }

  async function submit() {
    if (!active) return;

    if (active.id.startsWith("demo-")) {
      const score = Object.values(answers).filter((v) => v === 0).length * 10;
      setResult(`Demo score ${score} · sign in with API for real XP`);
      return;
    }

    if (!session?.accessToken) {
      setResult("Sign in to submit for XP.");
      return;
    }

    const res = await fetch(`${apiUrl}/api/quizzes/${active.id}/submit`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ answers }),
    });
    const data = await res.json();
    if (!res.ok) {
      setResult(data.message ?? "Submit failed");
      return;
    }
    setResult(
      `Score ${data.score}/${data.maxScore} · +${data.xpGain} XP`,
    );
  }

  return (
    <div className="relative min-h-screen px-6 py-10">
      <div className="pointer-events-none absolute inset-0 circuit-grid opacity-30" />
      <div className="relative z-10 mx-auto max-w-5xl">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-sky-300">
              Quiz Arena
            </p>
            <h1 className="mt-2 font-display text-4xl font-bold text-white">
              Timed knowledge raids
            </h1>
          </div>
          <Link href="/dashboard" className="text-sm text-sky-300 hover:underline">
            ← Dashboard
          </Link>
        </div>

        {error ? (
          <p className="mb-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {error}
          </p>
        ) : null}

        {!active ? (
          <div className="grid gap-4 md:grid-cols-2">
            {list.map((quiz) => (
              <article key={quiz.id} className="glass rounded-3xl p-6">
                <p className="font-mono text-xs text-violet-200">
                  {quiz.category} · {quiz.difficulty}
                </p>
                <h2 className="mt-2 font-display text-xl text-white">{quiz.title}</h2>
                <p className="mt-2 text-sm text-muted">{quiz.description}</p>
                <p className="mt-3 font-mono text-xs text-sky-300">
                  {quiz._count?.questions ?? "?"} Q · {quiz.timeLimit}s · {quiz.xpReward} XP
                </p>
                <Button className="mt-4" size="sm" onClick={() => startQuiz(quiz.id)}>
                  Start
                </Button>
              </article>
            ))}
          </div>
        ) : (
          <div className="glass rounded-3xl p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl text-white">{active.title}</h2>
              <Button variant="ghost" size="sm" onClick={() => setActive(null)}>
                Exit
              </Button>
            </div>
            <div className="mt-6 space-y-6">
              {active.questions.map((question, index) => (
                <div key={question.id}>
                  <p className="text-sm text-white">
                    {index + 1}. {question.prompt}
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {(question.options as string[]).map((option, optionIndex) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() =>
                          setAnswers((prev) => ({
                            ...prev,
                            [question.id]: optionIndex,
                          }))
                        }
                        className={`rounded-xl border px-3 py-2 text-left text-sm ${
                          answers[question.id] === optionIndex
                            ? "border-sky-400/50 bg-sky-500/15 text-sky-100"
                            : "border-white/10 bg-black/20 text-muted"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Button className="mt-6" onClick={submit}>
              Submit answers
            </Button>
            {result ? (
              <p className="mt-4 text-sm text-emerald-200">{result}</p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
