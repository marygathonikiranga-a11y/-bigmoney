import { useEffect, useState } from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

function generateData() {
  const data: { v: number }[] = [];
  let val = 50;
  for (let i = 0; i < 60; i++) {
    val += (Math.random() - 0.48) * 3;
    val = Math.max(20, Math.min(80, val));
    data.push({ v: +val.toFixed(2) });
  }
  return data;
}

const AnimatedChart = () => {
  const [data, setData] = useState(generateData);

  useEffect(() => {
    const iv = setInterval(() => {
      setData((prev) => {
        const next = [...prev.slice(1)];
        const last = next[next.length - 1].v;
        next.push({ v: +(last + (Math.random() - 0.48) * 2).toFixed(2) });
        return next;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="absolute inset-0 opacity-20 min-h-[400px] h-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(210 100% 55%)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="hsl(210 100% 55%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke="hsl(210 100% 55%)" strokeWidth={2} fill="url(#heroGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AnimatedChart;
