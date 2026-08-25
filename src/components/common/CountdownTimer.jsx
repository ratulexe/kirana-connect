import { useEffect, useState } from 'react';

export default function CountdownTimer({ endsAt, className = '' }) {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const calc = () => {
      const ms = Math.max(0, new Date(endsAt).getTime() - Date.now());
      const totalSeconds = Math.floor(ms / 1000);
      setTimeLeft({
        h: Math.floor(totalSeconds / 3600),
        m: Math.floor((totalSeconds % 3600) / 60),
        s: totalSeconds % 60,
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  const pad = (n) => String(n).padStart(2, '0');

  return (
    <div className={`flex items-end gap-1.5 ${className}`}>
      {[{ value: timeLeft.h, unit: 'hrs' }, { value: timeLeft.m, unit: 'min' }, { value: timeLeft.s, unit: 'sec' }].map(({ value, unit }, i) => (
        <div key={unit} className="flex items-end gap-1">
          {i > 0 && <span className="text-lg font-bold text-white/60 mb-3">:</span>}
          <div className="flex flex-col items-center">
            <div className="min-w-[2.2rem] rounded-lg bg-[#21165e] px-2 py-1 text-center font-extrabold text-white text-lg leading-none tabular-nums">{pad(value)}</div>
            <span className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-white/50">{unit}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
