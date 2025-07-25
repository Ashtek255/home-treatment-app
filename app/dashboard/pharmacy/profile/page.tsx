"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard/layout"
import { PharmacyProfileContent } from "@/components/dashboard/pharmacy/profile"
import { useAuth } from "@/contexts/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export default function PharmacyProfilePage() {
  const { userData, loading, user } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    // Only check authorization after loading is complete
    if (!loading) {
      // Check if user exists first
      if (!user) {
        setError("You must be logged in to view this page.")
      }
      // Then check if userData exists and is of correct type
      else if (userData && userData.userType !== "pharmacy") {
        console.log(`User type is ${userData.userType}, expected pharmacy`)
        setError("Unauthorized access. This page is only for pharmacies.")
      }
      setAuthChecked(true)
    }
  }, [userData, loading, user])

  // Always render the layout first to prevent flashing
  return (
    <DashboardLayout userType="pharmacy">
      {loading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="p-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      ) : (
        <PharmacyProfileContent />
      )}
    </DashboardLayout>
  )
}
