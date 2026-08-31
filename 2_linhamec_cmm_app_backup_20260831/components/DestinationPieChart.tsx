import React from 'react';

interface PieChartItem {
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export const DestinationPieChart: React.FC<{ data: PieChartItem[] }> = ({ data }) => {
  const filteredData = data.filter((d) => d.count > 0);
  if (filteredData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500 italic text-sm uppercase">
        Nenhum serviço finalizado
      </div>
    );
  }

  let currentAngle = 0;
  const segments = filteredData.map((item) => {
    const angle = (item.percentage / 100) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    return { ...item, startAngle, endAngle: currentAngle };
  });

  const polarToCartesian = (
    cx: number,
    cy: number,
    r: number,
    angle: number
  ) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const createArcPath = (
    cx: number,
    cy: number,
    r: number,
    startAngle: number,
    endAngle: number
  ) => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
  };

  return (
    <div className="flex flex-col lg:flex-row items-center gap-8">
      <div className="relative">
        <svg width="200" height="200" viewBox="0 0 200 200">
          {segments.map((segment, idx) => (
            <path
              key={idx}
              d={createArcPath(
                100,
                100,
                80,
                segment.startAngle,
                segment.endAngle
              )}
              fill={segment.color}
              stroke="#000"
              strokeWidth="2"
              className="hover:opacity-80 transition-opacity cursor-pointer"
            >
              <title>
                {segment.label}: {segment.count}x (
                {segment.percentage.toFixed(1)}%)
              </title>
            </path>
          ))}
          <circle cx="100" cy="100" r="40" fill="#09090b" />
          <text
            x="100"
            y="95"
            textAnchor="middle"
            className="fill-white text-xs font-bold uppercase"
          >
            Total
          </text>
          <text
            x="100"
            y="115"
            textAnchor="middle"
            className="fill-white text-2xl font-mono font-bold"
          >
            {filteredData.reduce((acc, d) => acc + d.count, 0)}
          </text>
        </svg>
      </div>
      <div className="flex-1 grid grid-cols-2 gap-3">
        {filteredData.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 bg-zinc-900 p-3 rounded-sm border border-zinc-800"
          >
            <div
              className="w-4 h-4 rounded-sm flex-shrink-0"
              style={{ backgroundColor: item.color }}
            ></div>
            <div className="flex-1 min-w-0">
              <span className="block text-[10px] font-bold uppercase text-white truncate">
                {item.label}
              </span>
              <span className="block text-[9px] text-zinc-400">
                {item.percentage.toFixed(1)}%
              </span>
            </div>
            <span className="text-sm font-mono font-bold text-white">
              {item.count}x
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
