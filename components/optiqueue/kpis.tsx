"use client"

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useSchedule } from "./store"

function KPIItem({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-sm">{label}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-2xl font-semibold">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </CardContent>
    </Card>
  )
}

function Sparkline({ data, width = 120, height = 28 }: { data: number[]; width?: number; height?: number }) {
  if (!data || !data.length) return null
  const max = Math.max(...data, 100)
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * width},${height - (v / max) * height}`)
    .join(' ')
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block">
      <polyline points={points} fill="none" stroke="var(--color-primary)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function KPIScorecard() {
  const { schedule } = useSchedule()
  const k = schedule?.kpis
  const util = k ? `${k.utilizationRate}%` : "—"
  const utilSub = k ? `Baseline ${k.baselineUtilizationRate}% (Target >85%)` : "Target >85%"
  const ot = k ? `${k.totalProjectedOvertime} min` : "—"
  const otSub = k ? `Baseline ${k.baselineOvertime} min (Target <10 min)` : "Target <10 min"
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">OT Utilization</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-semibold">{util}</div>
            {k?.utilizationDelta !== undefined && (
              <div className={k.utilizationDelta >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                {k.utilizationDelta >= 0 ? `▲ ${k.utilizationDelta}%` : `▼ ${Math.abs(k.utilizationDelta)}%`}
              </div>
            )}
          </div>
          <div className="mt-2">
            <Progress value={k ? Math.min(100, Math.max(0, k.utilizationRate)) : 0} />
            <div className="flex items-center justify-between mt-2">
              <div className="text-xs text-muted-foreground">{utilSub}</div>
              {k?.utilizationSeries && <Sparkline data={k.utilizationSeries} />}
            </div>
          </div>
        </CardContent>
      </Card>
      <KPIItem label="Projected Overtime" value={ot} sub={otSub} />
      <KPIItem label="Total Idle (Optimized)" value={schedule ? `${schedule.optimized.idleMinutes} min` : "—"} />
      <KPIItem label="Priority-weighted Wait" value={schedule ? `${schedule.optimized.waitCost} min` : "—"} />
    </div>
  )
}
