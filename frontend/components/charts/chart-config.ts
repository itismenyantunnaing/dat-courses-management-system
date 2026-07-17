// app/dashboard/components/chart-config.ts
export const CHART_COLORS = {
  blue: "#3b82f6",
  green: "#22c55e",
  yellow: "#eab308",
  orange: "#f97316",
  red: "#ef4444",
  purple: "#8b5cf6",
  pink: "#ec4899",
  cyan: "#06b6d4",
  indigo: "#6366f1",
  teal: "#14b8a6",
}

export const CHART_COLORS_PALETTE = [
  CHART_COLORS.blue,
  CHART_COLORS.green,
  CHART_COLORS.yellow,
  CHART_COLORS.orange,
  CHART_COLORS.red,
  CHART_COLORS.purple,
  CHART_COLORS.pink,
  CHART_COLORS.cyan,
  CHART_COLORS.indigo,
  CHART_COLORS.teal,
]

export const JLPT_LEVELS = ["N1", "N2", "N3", "N4", "N5"]
export const JLPT_COLORS = [
  "#8b5cf6",
  "#6366f1",
  "#3b82f6",
  "#22c55e",
  "#eab308",
]

// Mock data generators
export const generateJLPTDistribution = () => {
  return JLPT_LEVELS.map((level) => ({
    level,
    current: Math.floor(Math.random() * 30) + 5,
    target: Math.floor(Math.random() * 30) + 5,
  }))
}

export const generateAttendanceData = (days: number = 7) => {
  return Array.from({ length: days }, (_, i) => ({
    day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i % 7],
    attendance: Math.floor(Math.random() * 20) + 80,
  }))
}

// Course categories for grouping
export const COURSE_CATEGORIES = {
  examTarget: {
    label: "JLPT Exam Target",
    prefix: "JLPT-ETC",
    color: CHART_COLORS.blue,
  },
  examPractice: {
    label: "JLPT Exam Practice",
    prefix: "JLPT-EPC",
    color: CHART_COLORS.green,
  },
  business: {
    label: "Business Japanese",
    prefix: "BJC",
    color: CHART_COLORS.orange,
  },
}