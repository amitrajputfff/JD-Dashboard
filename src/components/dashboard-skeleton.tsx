import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export function DashboardSkeleton() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <Skeleton className="h-8 w-[300px]" />
        <Skeleton className="h-6 w-[100px]" />
      </div>

      {/* Key Metrics - 4 cards */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-3">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-[100px]" />
                <Skeleton className="h-6 w-[60px]" />
                <Skeleton className="h-3 w-[120px]" />
              </div>
              <Skeleton className="h-4 w-4 rounded" />
            </div>
          </Card>
        ))}
      </div>

      {/* Mini Charts - 4 cards */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-[120px]" />
                <Skeleton className="h-3 w-3 rounded" />
              </div>
              <Skeleton className="h-[60px] w-full" />
            </div>
          </Card>
        ))}
      </div>

      {/* Main Charts - 2 large cards */}
      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <div className="p-4 space-y-3">
            <div className="space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-3 w-[250px]" />
            </div>
            <Skeleton className="h-[300px] w-full" />
          </div>
        </Card>

        <Card>
          <div className="p-4 space-y-3">
            <div className="space-y-2">
              <Skeleton className="h-4 w-[180px]" />
              <Skeleton className="h-3 w-[220px]" />
            </div>
            <Skeleton className="h-[300px] w-full" />
          </div>
        </Card>
      </div>

      {/* Agent Performance Card */}
      <Card>
        <div className="p-4 space-y-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-[220px]" />
            <Skeleton className="h-3 w-[280px]" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-2 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[80px]" />
                    <Skeleton className="h-3 w-[100px]" />
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-[60px]" />
                    <Skeleton className="h-4 w-[40px]" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-[60px]" />
                    <Skeleton className="h-4 w-[40px]" />
                  </div>
                  <Skeleton className="h-2 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Performance Metrics - 4 small cards */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-3">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-[80px]" />
                <Skeleton className="h-6 w-[70px]" />
                <Skeleton className="h-3 w-[90px]" />
              </div>
              <Skeleton className="h-4 w-4 rounded" />
            </div>
          </Card>
        ))}
      </div>

      {/* Customer Journey Analytics Card */}
      <Card>
        <div className="p-4 space-y-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-[240px]" />
            <Skeleton className="h-3 w-[300px]" />
          </div>
          <Skeleton className="h-[300px] w-full" />
        </div>
      </Card>
    </div>
  )
}
