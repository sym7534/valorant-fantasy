'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface MemberPointsData {
  userId: string;
  name: string;
  color: string;
  weeklyScores: { weekNumber: number; cumulativePoints: number }[];
}

interface PointsChartProps {
  members: MemberPointsData[];
  totalWeeks: number;
  className?: string;
}

const MEMBER_COLORS = [
  '#ff4655',
  '#2dd4bf',
  '#f5c542',
  '#4ade80',
  '#818cf8',
  '#fb923c',
  '#f472b6',
  '#a78bfa',
  '#38bdf8',
  '#facc15',
  '#ef4444',
  '#34d399',
];

export default function PointsChart({
  members,
  totalWeeks,
  className = '',
}: PointsChartProps): React.ReactElement {
  // Build chart data: one entry per week
  const chartData = Array.from({ length: totalWeeks }, (_, i) => {
    const week = i + 1;
    const entry: Record<string, unknown> = { week: `W${week}` };
    for (const member of members) {
      const weekData = member.weeklyScores.find((w) => w.weekNumber === week);
      entry[member.userId] = weekData?.cumulativePoints ?? 0;
    }
    return entry;
  });

  return (
    <div className={`bg-[var(--bg-secondary)] border border-[var(--border-default)] clip-angular p-4 ${className}`}>
      <h3 className="text-sm font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)] mb-4">
        Points Over Time
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid stroke="#1e2d3d" strokeDasharray="3 3" />
          <XAxis
            dataKey="week"
            tick={{ fill: '#5a6672', fontSize: 11, fontFamily: 'var(--font-display)' }}
            axisLine={{ stroke: '#2a3a4a' }}
          />
          <YAxis
            tick={{ fill: '#5a6672', fontSize: 11, fontFamily: 'var(--font-display)' }}
            axisLine={{ stroke: '#2a3a4a' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a2634',
              border: '1px solid #2a3a4a',
              borderRadius: '2px',
              fontSize: 12,
            }}
            labelStyle={{ color: '#ece8e1', fontWeight: 'bold' }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, fontFamily: 'var(--font-display)' }}
          />
          {members.map((member, i) => (
            <Line
              key={member.userId}
              type="monotone"
              dataKey={member.userId}
              name={member.name}
              stroke={member.color || MEMBER_COLORS[i % MEMBER_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3, fill: member.color || MEMBER_COLORS[i % MEMBER_COLORS.length] }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
