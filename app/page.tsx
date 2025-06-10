"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LanguageToggle } from "@/components/language-toggle"
import { UserTypeSelection } from "@/components/user-type-selection"
import { useEffect, useState } from "react"

export default function Home() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-white">
      <header className="border-b bg-white/80 backdrop-blur-sm p-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Home Treatment App</h1>
        </div>
        {isClient && (
          <div className="flex-shrink-0 ml-4">
            <LanguageToggle />
          </div>
        )}
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md space-y-6 sm:space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-3 sm:space-y-4">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight">
              Healthcare at Your Doorstep
            </h2>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed px-2">
              Request doctors, order medicine, and manage your health from home
            </p>
          </div>

          {/* User Type Selection */}
          {isClient && (
            <div className="w-full">
              <UserTypeSelection />
            </div>
          )}

          {/* Login Section */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <p className="text-center text-sm sm:text-base text-gray-600">Already have an account?</p>
            <Button asChild className="w-full h-auto py-3 px-4 text-sm sm:text-base font-medium">
              <Link href="/login">Sign In to Your Account</Link>
            </Button>
          </div>
        </div>
      </div>

      <footer className="border-t bg-white/80 backdrop-blur-sm p-4 text-center">
        <p className="text-xs sm:text-sm text-gray-500">© 2025 Home Treatment App. All rights reserved.</p>
      </footer>
    </main>
  )
}
