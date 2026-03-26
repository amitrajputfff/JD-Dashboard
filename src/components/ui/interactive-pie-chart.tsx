"use client"

import * as React from "react"
import { TrendingUp } from "lucide-react"
import { Label, Pie, PieChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { cn } from "@/lib/utils"

interface PieChartData {
  name: string
  value: number
  color: string
}

interface InteractivePieChartProps {
  data: PieChartData[]
  title?: string
  description?: string
  className?: string
  showLegend?: boolean
  showTooltip?: boolean
  innerRadius?: number
  outerRadius?: number
  strokeWidth?: number
  footerText?: string
  footerSubtext?: string
  trendPercentage?: number
}

export function InteractivePieChart({
  data,
  title = "Issue Type Distribution",
  description = "Breakdown of customer service issues by category",
  className,
  showLegend = true,
  showTooltip = true,
  innerRadius = 60,
  outerRadius = 100,
  strokeWidth = 5,
  footerText,
  footerSubtext,
  trendPercentage,
}: InteractivePieChartProps) {
  const totalValue = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.value, 0)
  }, [data])

  // Create chart config for legends and tooltips
  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      value: {
        label: "Issues",
      },
    }
    data.forEach((item, index) => {
      // Create a safe key from the name
      const key = item.name.toLowerCase().replace(/[^a-z0-9]/g, '-')
      config[key] = {
        label: item.name,
        color: item.color,
      }
    })
    return config
  }, [data])

  // Convert data to the format expected by the chart
  const chartData = React.useMemo(() => {
    return data.map((item, index) => {
      // Create the same safe key to reference the color variable
      const key = item.name.toLowerCase().replace(/[^a-z0-9]/g, '-')
      return {
        name: item.name,
        value: item.value,
        fill: `var(--color-${key})`,
      }
    })
  }, [data])

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="items-center pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel indicator="dot" config={chartConfig} />}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              strokeWidth={strokeWidth}
              stroke="hsl(var(--background))"
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalValue.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground text-sm"
                        >
                          Total
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      {(footerText || footerSubtext || trendPercentage !== undefined) && (
        <CardFooter className="flex-col gap-2 text-xs pt-4">
          {trendPercentage !== undefined && (
            <div className="flex items-center gap-2 leading-none font-medium text-xs">
              {trendPercentage > 0 ? "Trending up" : "Trending down"} by {Math.abs(trendPercentage).toFixed(1)}% this month{" "}
              <TrendingUp className={cn("h-3 w-3", trendPercentage < 0 && "rotate-180")} />
            </div>
          )}
          {footerText && (
            <div className="text-muted-foreground leading-none text-xs">
              {footerText}
            </div>
          )}
          {footerSubtext && (
            <div className="text-muted-foreground leading-none text-xs">
              {footerSubtext}
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  )
}

// Default export for backward compatibility
export default InteractivePieChart
