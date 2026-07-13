"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GameFrame } from "@/components/games/game-frame";

const QUESTIONS = [
  {
    clue: "Outputs humidity + temperature over a digital bus",
    answer: "DHT22",
    options: ["DHT22", "HC-SR04", "MPU6050", "MQ-2"],
  },
  {
    clue: "Measures distance using ultrasonic pulses",
    answer: "HC-SR04",
    options: ["BMP280", "HC-SR04", "PIR", "LDR"],
  },
  {
    clue: "6-axis IMU for motion sensing",
    answer: "MPU6050",
    options: ["NEO-6M", "MPU6050", "SSD1306", "DS18B20"],
  },
];

export default function GuessSensorPage() {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const q = QUESTIONS[index];

  function pick(option: string) {
    const nextScore = score + (option === q.answer ? 1 : 0);
    setScore(nextScore);
    if (index + 1 >= QUESTIONS.length) {
      setDone(true);
    } else {
      setIndex((i) => i + 1);
    }
  }

  return (
    <GameFrame
      title="Guess the Sensor"
      subtitle="Read the clue and identify the component."
    >
      {done ? (
        <p className="text-emerald-200">
          Score {score}/{QUESTIONS.length} · +{score * 12} XP
        </p>
      ) : (
        <>
          <p className="text-white">{q.clue}</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {q.options.map((option) => (
              <Button
                key={option}
                variant="secondary"
                onClick={() => pick(option)}
              >
                {option}
              </Button>
            ))}
          </div>
        </>
      )}
    </GameFrame>
  );
}
