"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { AdminDashboard } from "@/components/dashboard/admin-dashboard"
import { Loader2 } from "lucide-react"

export default function AdminDashboardPage() {
  const router = useRouter()
  const { user, userData, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login")
      } else if (userData?.userType !== "admin") {
        // Non-admin users are redirected to their dashboard or login
        if (userData?.userType && ["patient", "doctor", "pharmacy"].includes(userData.userType)) {
          router.push(`/dashboard/${userData.userType}`)
        } else {
          router.push("/login")
        }
      }
    }
  }, [user, userData, loading, router])

  if (loading || !user || userData?.userType !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  return <AdminDashboard />
}
