import type { CaseInput } from "./types"

export const SAMPLE_SURGERIES: CaseInput[] = [
  { id: "S-101", name: "Hip Replacement", durationMinutes: 120, surgeon: "Dr. Smith", equipment: "C-Arm", priority: 2 },
  { id: "S-102", name: "Appendectomy", durationMinutes: 60, surgeon: "Dr. Lee", equipment: "Lap Tower", priority: 3 },
  { id: "S-103", name: "Knee Arthroscopy", durationMinutes: 90, surgeon: "Dr. Patel", equipment: "Scope", priority: 4 },
  { id: "S-104", name: "CABG", durationMinutes: 180, surgeon: "Dr. Chen", equipment: "Heart-Lung", priority: 1 },
  { id: "S-105", name: "Spine Fusion", durationMinutes: 150, surgeon: "Dr. Smith", equipment: "C-Arm", priority: 3 },
  {
    id: "S-106",
    name: "Cholecystectomy",
    durationMinutes: 75,
    surgeon: "Dr. Lee",
    equipment: "Lap Tower",
    priority: 3,
  },
  {
    id: "S-107",
    name: "Hernia Repair",
    durationMinutes: 45,
    surgeon: "Dr. Gomez",
    equipment: "Basic Set",
    priority: 5,
  },
  {
    id: "S-108",
    name: "Thyroidectomy",
    durationMinutes: 110,
    surgeon: "Dr. Patel",
    equipment: "Neuro Monitor",
    priority: 4,
  },
]
