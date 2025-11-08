"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useSchedule, useSurgeries, setScheduleGlobal, setDelayedGlobal } from "./store"
import { optimizeSchedule, baselineSchedule, computeKPIs } from "./scheduler"
import { type CaseInput, DEFAULT_DAY, TURNOVER_MINUTES } from "./types"

export function EmergencyInserter() {
  const { surgeries, setSurgeries } = useSurgeries()
  const { schedule } = useSchedule()

  const handleEmergency = (formData: FormData) => {
    const id = `${formData.get("caseId") || ""}`.trim() || `EM-${Math.floor(Math.random() * 900 + 100)}`
    const name = `${formData.get("name") || ""}`.trim() || "Emergency Case"
    const duration = Number(formData.get("duration") || 60)
    const surgeon = `${formData.get("surgeon") || ""}`.trim() || "Dr. Smith"
    const equipment = `${formData.get("equipment") || ""}`.trim() || "C-Arm"

    const emergency: CaseInput = {
      id,
      name,
      durationMinutes: Math.max(15, duration),
      surgeon,
      equipment,
      priority: 1,
    }
    const before = schedule?.optimized.cases || []
    const nextCases = [emergency, ...surgeries]
    setSurgeries(nextCases)
    const optimized = optimizeSchedule(nextCases, DEFAULT_DAY, TURNOVER_MINUTES)
    const baseline = baselineSchedule(nextCases, DEFAULT_DAY, TURNOVER_MINUTES)
    const kpis = computeKPIs(optimized, baseline, DEFAULT_DAY)

    // detect delayed elective cases (start time increased vs prior schedule by >= 5 min)
    const prevStarts = new Map(before.map((c) => [c.id, c.startMinute]))
    const delayed = new Set<string>()
    optimized.cases.forEach((c) => {
      const prevStart = prevStarts.get(c.id)
      if (prevStart != null && c.startMinute - prevStart >= 5 && c.priority > 1) {
        delayed.add(c.id)
      }
    })
    setDelayedGlobal(delayed)
    setScheduleGlobal({ optimized, baseline, kpis })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Emergency Case Insertion</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleEmergency} className="grid grid-cols-2 gap-2">
          <Input name="caseId" placeholder="Emergency ID (optional)" className="col-span-2" />
          <Input name="name" placeholder="Procedure name" className="col-span-2" />
          <Input name="duration" type="number" min={15} step={5} defaultValue={60} placeholder="Duration (min)" />
          <Input name="surgeon" placeholder="Required Surgeon" />
          <Input name="equipment" placeholder="Required Equipment" />
          <Button type="submit" className="col-span-2">
            Insert and Re-Optimize
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2">
          Delayed elective cases will be highlighted in the timeline.
        </p>
      </CardContent>
    </Card>
  )
}
