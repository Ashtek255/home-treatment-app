"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"

export default function ProfileRedirectPage() {
  const router = useRouter()
  const { userData, loading } = useAuth()

  useEffect(() => {
    if (!loading && userData) {
      // Redirect to the appropriate profile page based on user type
      router.push(`/dashboard/${userData.userType}/profile`)
    }
  }, [userData, loading, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2">Redirecting to your profile...</span>
    </div>
  )
}
