import { useState, useEffect } from "react";
import { formatDistanceToNowStrict } from "date-fns";

export function Countdown({ endTime }: { endTime: Date }) {
  const [timeLeft, setTimeLeft] = useState<{
    d: number;
    h: number;
    m: number;
    s: number;
  } | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const distance = end - now;

      if (distance < 0) {
        clearInterval(timer);
        setIsExpired(true);
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
        return;
      }

      setTimeLeft({
        d: Math.floor(distance / (1000 * 60 * 60 * 24)),
        h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  if (!timeLeft)
    return (
      <div className="font-mono text-primary animate-pulse">CALCULATING...</div>
    );
  if (isExpired)
    return (
      <div className="font-mono text-destructive font-bold">
        HACKATHON ENDED
      </div>
    );

  return (
    <div className="flex space-x-4 font-mono">
      <TimeUnit value={timeLeft.d} label="DAYS" />
      <TimeUnit value={timeLeft.h} label="HRS" />
      <TimeUnit value={timeLeft.m} label="MIN" />
      <TimeUnit value={timeLeft.s} label="SEC" highlight />
    </div>
  );
}

function TimeUnit({
  value,
  label,
  highlight,
}: {
  value: number;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`text-2xl sm:text-4xl font-bold ${highlight ? "text-primary text-glow-primary" : "text-foreground"}`}
      >
        {value.toString().padStart(2, "0")}
      </div>
      <div className="text-[10px] text-muted-foreground tracking-widest">
        {label}
      </div>
    </div>
  );
}
