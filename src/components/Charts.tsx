import React from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

/**
 * Trend Chart - Shows score changes over time
 */
interface TrendDataPoint {
  name: string
  score: number
}

export function TrendChart({
  data,
  title,
  height = 300,
}: {
  data: TrendDataPoint[]
  title?: string
  height?: number
}) {
  return (
    <div className="w-full">
      {title && <h4 className="text-white font-semibold mb-4">{title}</h4>}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="name" stroke="#9CA3AF" />
          <YAxis stroke="#9CA3AF" domain={[0, 100]} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #4B5563',
              borderRadius: '8px',
            }}
            labelStyle={{ color: '#F3F4F6' }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={{ fill: '#3B82F6', r: 5 }}
            name="Efficiency Score"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

/**
 * Comparison Bar Chart - Compare multiple boards
 */
interface ComparisonDataPoint {
  name: string
  score: number
  lifespan: number
  quality: number
}

export function ComparisonBarChart({
  data,
  title,
  height = 300,
}: {
  data: ComparisonDataPoint[]
  title?: string
  height?: number
}) {
  return (
    <div className="w-full">
      {title && <h4 className="text-white font-semibold mb-4">{title}</h4>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
          <YAxis stroke="#9CA3AF" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #4B5563',
              borderRadius: '8px',
            }}
            labelStyle={{ color: '#F3F4F6' }}
          />
          <Legend />
          <Bar dataKey="score" fill="#10B981" name="Efficiency Score" />
          <Bar dataKey="quality" fill="#8B5CF6" name="Data Quality %" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/**
 * Role Distribution Pie Chart
 */
interface RoleDataPoint {
  name: string
  value: number
}

export function RoleDistributionChart({
  data,
  title,
  height = 300,
}: {
  data: RoleDataPoint[]
  title?: string
  height?: number
}) {
  const COLORS = [
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
    '#EC4899',
  ]

  return (
    <div className="w-full">
      {title && <h4 className="text-white font-semibold mb-4">{title}</h4>}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name} (${value})`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #4B5563',
              borderRadius: '8px',
            }}
            labelStyle={{ color: '#F3F4F6' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

/**
 * Trend Sparkline - Minimal inline trend visualization
 */
interface SparklineDataPoint {
  value: number
}

export function Sparkline({
  data,
  color = '#3B82F6',
  height = 40,
}: {
  data: SparklineDataPoint[]
  color?: string
  height?: number
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

/**
 * Board Performance Radar Chart (alternative to bar)
 */
interface RadarDataPoint {
  metric: string
  value: number
  fullMark: number
}

export function BoardPerformanceChart({
  data,
  title,
  height = 300,
}: {
  data: RadarDataPoint[]
  title?: string
  height?: number
}) {
  // Simplified performance chart using bar chart approach
  return (
    <div className="w-full">
      {title && <h4 className="text-white font-semibold mb-4">{title}</h4>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis type="number" stroke="#9CA3AF" domain={[0, 100]} />
          <YAxis
            dataKey="metric"
            type="category"
            width={90}
            stroke="#9CA3AF"
            fontSize={12}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #4B5563',
              borderRadius: '8px',
            }}
            labelStyle={{ color: '#F3F4F6' }}
          />
          <Bar dataKey="value" fill="#3B82F6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/**
 * Board Efficiency Score Chart - Horizontal bar chart for multiple boards
 */
interface BoardScoreData {
  name: string
  score: number
  grade: string
}

export function BoardScoresChart({
  data,
  title,
  height = 300,
}: {
  data: BoardScoreData[]
  title?: string
  height?: number
}) {
  const chartData = data.map((board) => ({
    name: board.name,
    score: board.score,
    remaining: 100 - board.score,
  }))

  return (
    <div className="w-full">
      {title && <h4 className="text-white font-semibold mb-4">{title}</h4>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          layout="vertical"
          data={chartData}
          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis type="number" stroke="#9CA3AF" domain={[0, 100]} />
          <YAxis
            dataKey="name"
            type="category"
            width={90}
            stroke="#9CA3AF"
            fontSize={11}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #4B5563',
              borderRadius: '8px',
            }}
            labelStyle={{ color: '#F3F4F6' }}
            formatter={(value) => `${value}`}
          />
          <Bar dataKey="score" stackId="a" fill="#10B981" name="Score" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
