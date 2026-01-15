"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Run } from "@/app/types";

export default function RunHistoryChart({ runs }: { runs: Run[] }) {
  // 1. Process data: Sort by date (oldest first) and calculate pass rate
  const data = [...runs].reverse().map(run => {
    const passRate = run.total_tests > 0 
      ? Math.round((run.correct / run.total_tests) * 100) 
      : 0;
      
    return {
      name: run.model_name, // or run.run_id.slice(0,4)
      date: new Date(run.created_at || Date.now()).toLocaleDateString(),
      passRate: passRate
    };
  });

  return (
    <div className="h-64 w-full rounded-xl bg-gray-800 p-4 border border-gray-700">
      <h3 className="mb-4 text-lg font-bold text-white">Success Rate Over Time</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
          <YAxis stroke="#9CA3AF" fontSize={12} unit="%" />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }}
          />
          <Line 
            type="monotone" 
            dataKey="passRate" 
            stroke="#10B981" 
            strokeWidth={3}
            activeDot={{ r: 8 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}