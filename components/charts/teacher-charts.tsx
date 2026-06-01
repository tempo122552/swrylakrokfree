"use client";

import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const colors = ["#1f8a5b", "#2563eb", "#d97706", "#be123c", "#6d28d9", "#0f766e"];

export function TeacherCharts({
  classroomBars,
  wasteTypePie,
}: {
  classroomBars: Array<{ classroom: string; points: number; items: number }>;
  wasteTypePie: Array<{ wasteTypeName: string; itemCount: number }>;
}) {
  return (
    <section className="grid min-w-0 gap-6 xl:grid-cols-2">
      <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-black">เปรียบเทียบตามห้องเรียน</h2>
        <div className="mt-4 h-80 min-w-0">
          <ResponsiveContainer height="100%" minWidth={0} width="100%">
            <BarChart data={classroomBars}>
              <XAxis dataKey="classroom" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="points" fill="#1f8a5b" name="แต้ม" radius={[4, 4, 0, 0]} />
              <Bar dataKey="items" fill="#2563eb" name="จำนวนชิ้น" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-black">สัดส่วนชนิดขยะ</h2>
        <div className="mt-4 h-80 min-w-0">
          <ResponsiveContainer height="100%" minWidth={0} width="100%">
            <PieChart>
              <Pie
                data={wasteTypePie}
                dataKey="itemCount"
                label
                nameKey="wasteTypeName"
                outerRadius={105}
              >
                {wasteTypePie.map((entry, index) => (
                  <Cell fill={colors[index % colors.length]} key={entry.wasteTypeName} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
