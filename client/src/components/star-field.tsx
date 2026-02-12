import { useMemo } from "react";

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
}

export function StarField({ count = 120 }: { count?: number }) {
  const stars = useMemo<Star[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      delay: Math.random() * 5,
      duration: Math.random() * 3 + 2,
      opacity: Math.random() * 0.6 + 0.2,
    }));
  }, [count]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white animate-twinkle"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            animationDelay: `${star.delay}s`,
            ["--twinkle-duration" as string]: `${star.duration}s`,
          }}
        />
      ))}
      <div
        className="absolute w-64 h-64 rounded-full opacity-[0.03] dark:opacity-[0.06]"
        style={{
          background: "radial-gradient(circle, hsl(217 91% 60%), transparent)",
          top: "10%",
          right: "15%",
          filter: "blur(60px)",
        }}
      />
      <div
        className="absolute w-48 h-48 rounded-full opacity-[0.03] dark:opacity-[0.05]"
        style={{
          background: "radial-gradient(circle, hsl(262 83% 58%), transparent)",
          bottom: "20%",
          left: "10%",
          filter: "blur(50px)",
        }}
      />
    </div>
  );
}
