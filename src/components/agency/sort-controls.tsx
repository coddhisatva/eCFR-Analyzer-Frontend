"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

export function SortControls() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSort = searchParams.get("sortBy") || "name"

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("sortBy", value)
    router.push(`/agency?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-600">Sort by:</span>
      <RadioGroup 
        value={currentSort} 
        onValueChange={handleSortChange}
        className="flex gap-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="name" id="name" />
          <Label htmlFor="name">Name</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="num_cfr" id="cfr" />
          <Label htmlFor="cfr">CFR References</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="num_children" id="subagencies" />
          <Label htmlFor="subagencies">Subagencies</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="num_sections" id="sections" />
          <Label htmlFor="sections">Sections</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="num_words" id="words" />
          <Label htmlFor="words">Words</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="num_corrections" id="corrections" />
          <Label htmlFor="corrections">Corrections</Label>
        </div>
      </RadioGroup>
    </div>
  )
} 