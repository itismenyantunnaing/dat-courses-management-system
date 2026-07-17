// app/dashboard/components/stat-card.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon, ArrowLeft01Icon } from "@hugeicons/core-free-icons"

interface StatCardProps {
  title: string
  value: string | number
  icon?: any
  description?: string
  trend?: {
    value: number
    direction: 'up' | 'down'
  }
  className?: string
}

export function StatCard({ title, value, icon, description, trend, className }: StatCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && (
          <HugeiconsIcon icon={icon} strokeWidth={2} className="h-4 w-4 text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <div className="mt-2 flex items-center gap-1 text-xs">
            <span
              className={cn(
                "flex items-center",
                trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
              )}
            >
              <HugeiconsIcon
                icon={trend.direction === 'up' ? ArrowRight01Icon : ArrowLeft01Icon}
                strokeWidth={2}
                className="h-3 w-3"
              />
              {trend.value}%
            </span>
            <span className="text-muted-foreground">from last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}