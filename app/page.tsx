"use client"

import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Gantt } from "@/components/optiqueue/gantt"
import { KPIScorecard } from "@/components/optiqueue/kpis"
import { ConstraintChecker } from "@/components/optiqueue/constraint-checker"
import { EmergencyInserter } from "@/components/optiqueue/emergency-inserter"
import { VoiceAssistant } from "@/components/optiqueue/voice-assistant"
import { useSchedule, useSurgeries } from "@/components/optiqueue/store"
import { optimizeSchedule, computeKPIs, baselineSchedule } from "@/components/optiqueue/scheduler"
import { DEFAULT_DAY, TURNOVER_MINUTES } from "@/components/optiqueue/types"
import { SAMPLE_SURGERIES } from "@/components/optiqueue/sample-data"

export default function Page() {
  return (
    <main className="min-h-dvh p-4 md:p-6 lg:p-8 space-y-6">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-semibold text-pretty">OptiQueue: OR Scheduling Optimization</h1>
        <div className="flex items-center gap-2">
          <VoiceAssistant />
        </div>
      </header>

      <Suspense fallback={<div className="text-muted-foreground">Loading dashboard...</div>}>
        <Dashboard />
      </Suspense>
    </main>
  )
}

function Dashboard() {
  const { surgeries, setSurgeries } = useSurgeries()
  const { schedule, setSchedule, delayedIds, setDelayedIds } = useSchedule()

  const onLoadSample = () => {
    setSurgeries(SAMPLE_SURGERIES)
    setSchedule(undefined)
    setDelayedIds(new Set())
  }

  const onGenerate = () => {
    if (!surgeries.length) return
    const optimized = optimizeSchedule(surgeries, DEFAULT_DAY, TURNOVER_MINUTES)
    const baseline = baselineSchedule(surgeries, DEFAULT_DAY, TURNOVER_MINUTES)
    setSchedule({
      optimized,
      baseline,
      kpis: computeKPIs(optimized, baseline, DEFAULT_DAY),
    })
    setDelayedIds(new Set())
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      <section className="xl:col-span-3 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inputs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Button onClick={onLoadSample} variant="secondary">
                Load sample list
              </Button>
              <Button
                onClick={() => {
                  setSurgeries([])
                  setSchedule(undefined)
                  setDelayedIds(new Set())
                }}
                variant="ghost"
              >
                Clear
              </Button>
            </div>
            <Separator />
            <AddCaseForm />
            <p className="text-sm text-muted-foreground">Turnover time: {TURNOVER_MINUTES} minutes</p>
            <Button className="w-full" onClick={onGenerate}>
              Generate Optimized Schedule
            </Button>
          </CardContent>
        </Card>

        <ConstraintChecker />
        <EmergencyInserter />
      </section>

      <section className="xl:col-span-9 space-y-4">
        <KPIScorecard />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gantt Chart Timeline (07:00 - 17:00)</CardTitle>
          </CardHeader>
          <CardContent>
            <Gantt delayedIds={delayedIds} />
          </CardContent>
        </Card>

        <CasesTable />
      </section>
    </div>
  )
}

function AddCaseForm() {
  const { addCase } = useSurgeries()
  const handleSubmit = (formData: FormData) => {
    const id = `${formData.get("caseId") || ""}`.trim() || `S-${Math.floor(Math.random() * 900 + 100)}`
    const name = `${formData.get("name") || ""}`.trim() || "Elective Case"
    const duration = Number(formData.get("duration") || 60)
    const surgeon = `${formData.get("surgeon") || ""}`.trim() || "Dr. Smith"
    const equipment = `${formData.get("equipment") || ""}`.trim() || "C-Arm"
    const priority = Number(formData.get("priority") || 3)
    // Clamp priority into the 1..5 union and cast to the precise union type
    const clampedPriority = Math.min(5, Math.max(1, priority)) as 1 | 2 | 3 | 4 | 5
    addCase({
      id,
      name,
      durationMinutes: Math.max(15, duration),
      surgeon,
      equipment,
      priority: clampedPriority,
    })
  }

  return (
    <form action={handleSubmit} className="grid grid-cols-2 gap-2">
      <Input name="caseId" placeholder="Case ID (optional)" className="col-span-2" />
      <Input name="name" placeholder="Procedure name" className="col-span-2" />
      <Input name="duration" type="number" min={15} step={5} defaultValue={60} placeholder="Duration (min)" />
      <Input name="surgeon" placeholder="Required Surgeon" />
      <Input name="equipment" placeholder="Required Equipment" />
      <Select name="priority" defaultValue="3">
        <SelectTrigger>
          <SelectValue placeholder="Priority (1 urgent - 5)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">1 - Urgent</SelectItem>
          <SelectItem value="2">2</SelectItem>
          <SelectItem value="3">3</SelectItem>
          <SelectItem value="4">4</SelectItem>
          <SelectItem value="5">5 - Elective</SelectItem>
        </SelectContent>
      </Select>
      <Button type="submit" className="col-span-2">
        Add Case
      </Button>
    </form>
  )
}

function CasesTable() {
  const { surgeries, removeCase } = useSurgeries()
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Case List</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-muted-foreground">
            <tr className="text-left">
              <th className="py-2 pr-2">Case</th>
              <th className="py-2 pr-2">Priority</th>
              <th className="py-2 pr-2">Duration</th>
              <th className="py-2 pr-2">Surgeon</th>
              <th className="py-2 pr-2">Equipment</th>
              <th className="py-2 pr-2"></th>
            </tr>
          </thead>
          <tbody>
            {surgeries.map((s) => (
              <tr key={s.id} className="border-t border-border">
                <td className="py-2 pr-2">
                  {s.id} — {s.name}
                </td>
                <td className="py-2 pr-2">{s.priority}</td>
                <td className="py-2 pr-2">{s.durationMinutes} min</td>
                <td className="py-2 pr-2">{s.surgeon}</td>
                <td className="py-2 pr-2">{s.equipment}</td>
                <td className="py-2 pr-2 text-right">
                  <Button variant="ghost" size="sm" onClick={() => removeCase(s.id)}>
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
            {!surgeries.length && (
              <tr>
                <td colSpan={6} className="text-muted-foreground py-6">
                  No cases yet. Load sample or add cases.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
