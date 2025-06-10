"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <Card className={className}>
      <CardContent className="py-12 text-center">
        <Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-500 mb-4 max-w-sm mx-auto">{description}</p>
        {action && <Button onClick={action.onClick}>{action.label}</Button>}
      </CardContent>
    </Card>
  )
}
