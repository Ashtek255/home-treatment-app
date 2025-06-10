"use client"

import { useOnlineStatus } from "@/hooks/use-online-status"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { WifiOff } from "lucide-react"

export function OfflineIndicator() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <Alert variant="destructive" className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto">
      <WifiOff className="h-4 w-4" />
      <AlertDescription>You're currently offline. Some features may not work properly.</AlertDescription>
    </Alert>
  )
}
