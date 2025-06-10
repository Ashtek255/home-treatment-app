"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"

export default function DashboardPage() {
  const router = useRouter()
  const { user, userData, loading } = useAuth()

  useEffect(() => {
    console.log("Main dashboard - Auth state:", { user: !!user, userData, loading })

    if (!loading && user && userData) {
      console.log("Redirecting user based on type:", userData.userType)

      switch (userData.userType) {
        case "admin":
          console.log("Redirecting to admin dashboard")
          router.replace("/dashboard/admin")
          break
        case "patient":
          console.log("Redirecting to patient dashboard")
          router.replace("/dashboard/patient")
          break
        case "doctor":
          console.log("Redirecting to doctor dashboard")
          router.replace("/dashboard/doctor")
          break
        case "pharmacy":
          console.log("Redirecting to pharmacy dashboard")
          router.replace("/dashboard/pharmacy")
          break
        default:
          console.log("Unknown user type, redirecting to login")
          router.replace("/login")
      }
    } else if (!loading && !user) {
      console.log("No user found, redirecting to login")
      router.replace("/login")
    }
  }, [user, userData, loading, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-lg">Redirecting to your dashboard...</p>
        {userData && <p className="text-sm text-gray-500">User type: {userData.userType}</p>}
      </div>
    </div>
  )
}
