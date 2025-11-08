"use client"
import { useSchedule } from "./store"
import { DEFAULT_DAY, minutesToTime, OTS, type ScheduledCase, TURNOVER_MINUTES } from "./types"
import { cn } from "@/lib/utils"
import type { JSX } from "react" // Declare JSX variable

const TOTAL_MINUTES = DEFAULT_DAY.endMinute - DEFAULT_DAY.startMinute

export function Gantt({ delayedIds }: { delayedIds: Set<string> }) {
  const { schedule } = useSchedule()
  const cases = schedule?.optimized.cases || []
  const perOT: Array<ScheduledCase[]> = Array.from({ length: OTS }, () => [])
  cases.forEach((c) => perOT[c.otIndex].push(c))
  perOT.forEach((row) => row.sort((a, b) => a.startMinute - b.startMinute))

  return (
    <div className="space-y-2">
      <TimeAxis />
      <div className="space-y-2">
        {perOT.map((row, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className="w-16 text-xs text-muted-foreground">OT {idx + 1}</div>
            <div className="relative flex-1 h-16 rounded-md bg-muted overflow-hidden">{renderRow(row, delayedIds)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TimeAxis() {
  const ticks = [0, 120, 240, 360, 480, 600]
  return (
    <div className="flex items-center gap-2">
      <div className="w-16" />
      <div className="relative flex-1 h-6">
        {ticks.map((t, i) => (
          <div key={i} className="absolute top-0" style={{ left: `${(t / TOTAL_MINUTES) * 100}%` }}>
            <div className="w-px h-6 bg-border" />
            <div className="absolute -translate-x-1/2 top-6 text-[10px] text-muted-foreground">
              {minutesToTime(7, t)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function renderRow(row: ScheduledCase[], delayedIds: Set<string>): JSX.Element[] {
  const blocks: JSX.Element[] = []
  let t = DEFAULT_DAY.startMinute
  row.forEach((c, i) => {
    // idle gap
    if (c.startMinute > t) {
      const left = ((t - DEFAULT_DAY.startMinute) / TOTAL_MINUTES) * 100
      const width = ((c.startMinute - t) / TOTAL_MINUTES) * 100
      blocks.push(
        <div
          key={`idle-${i}`}
          className="absolute top-0 h-16 bg-muted/50"
          style={{ left: `${left}%`, width: `${width}%` }}
        />,
      )
    }
    // case block
    const left = ((c.startMinute - DEFAULT_DAY.startMinute) / TOTAL_MINUTES) * 100
    const width = ((c.endMinute - c.startMinute) / TOTAL_MINUTES) * 100
    const delayed = delayedIds.has(c.id)
    blocks.push(
      <div
        key={c.id}
        className={cn(
          "absolute top-1 h-10 rounded-sm border",
          delayed ? "bg-destructive/20 border-destructive" : "bg-primary/10 border-primary",
        )}
        style={{ left: `${left}%`, width: `${width}%` }}
        title={`${c.id} ${c.name} (${c.durationMinutes} min) • ${c.surgeon} • ${c.equipment}`}
      >
        <div className="px-2 py-1 text-[11px] leading-4">
          <div className="font-medium">
            {c.id} • P{c.priority}
          </div>
          <div className="text-xs text-muted-foreground">{`${minutesToTime(7, c.startMinute)} - ${minutesToTime(7, c.endMinute)}`}</div>
        </div>
      </div>,
    )
    // turnover block
    const turnLeft = ((c.endMinute - DEFAULT_DAY.startMinute) / TOTAL_MINUTES) * 100
    const turnWidth = (TURNOVER_MINUTES / TOTAL_MINUTES) * 100
    blocks.push(
      <div
        key={`turn-${i}`}
        className="absolute top-12 h-3 bg-accent rounded-sm"
        style={{ left: `${turnLeft}%`, width: `${turnWidth}%` }}
        title={`Turnover ${TURNOVER_MINUTES} min`}
      />,
    )
    t = c.endMinute + TURNOVER_MINUTES
  })
  return blocks
}
