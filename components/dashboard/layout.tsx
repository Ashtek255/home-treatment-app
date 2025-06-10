"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LanguageToggle } from "@/components/language-toggle"
import {
  User,
  UserCog,
  Building2,
  Home,
  Calendar,
  Pill,
  MessageSquare,
  LogOut,
  Menu,
  X,
  UserCircle,
} from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useAuth } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

type UserType = "patient" | "doctor" | "pharmacy"

interface DashboardLayoutProps {
  children: React.ReactNode
  userType: UserType
}

export function DashboardLayout({ children, userType }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const { logout, userData } = useAuth()

  const getUserIcon = (type: UserType) => {
    switch (type) {
      case "patient":
        return <User className="h-6 w-6" />
      case "doctor":
        return <UserCog className="h-6 w-6" />
      case "pharmacy":
        return <Building2 className="h-6 w-6" />
    }
  }

  const getUserTitle = (type: UserType) => {
    switch (type) {
      case "patient":
        return "Patient Dashboard"
      case "doctor":
        return "Doctor Dashboard"
      case "pharmacy":
        return "Pharmacy Dashboard"
    }
  }

  const getNavItems = (type: UserType) => {
    const commonItems = [
      { icon: Home, label: "Dashboard", href: `/dashboard/${type}` },
      { icon: MessageSquare, label: "Messages", href: `/dashboard/${type}/messages` },
      { icon: UserCircle, label: "Profile", href: `/dashboard/${type}/profile` },
      // Remove this line: { icon: Settings, label: "Settings", href: `/dashboard/${type}/settings` },
    ]

    switch (type) {
      case "patient":
        return [
          ...commonItems,
          { icon: UserCog, label: "Find Doctors", href: "/dashboard/patient/find-doctors" },
          { icon: Pill, label: "Order Medicine", href: "/dashboard/patient/order-medicine" },
          { icon: Calendar, label: "Appointments", href: "/dashboard/patient/appointments" },
        ]
      case "doctor":
        return [
          ...commonItems,
          { icon: Calendar, label: "Appointments", href: "/dashboard/doctor/appointments" },
          { icon: User, label: "Patients", href: "/dashboard/doctor/patients" },
        ]
      case "pharmacy":
        return [
          ...commonItems,
          { icon: Pill, label: "Inventory", href: "/dashboard/pharmacy/inventory" },
          { icon: Calendar, label: "Orders", href: "/dashboard/pharmacy/orders" },
        ]
    }
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleLogout = async () => {
    try {
      await logout()
      // Redirect will be handled by the auth context
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
  }

  return (
    <ProtectedRoute allowedUserTypes={[userType]}>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="border-b p-4 flex justify-between items-center bg-white">
          <div className="flex items-center gap-2">
            {!isDesktop && (
              <Button variant="ghost" size="icon" onClick={toggleSidebar}>
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <h1 className="text-xl font-bold">Home Treatment App</h1>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Link href="/dashboard/profile">
              <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                  {userData?.fullName ? getInitials(userData.fullName) : "U"}
                </AvatarFallback>
              </Avatar>
            </Link>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Logout</span>
            </Button>
          </div>
        </header>

        <div className="flex flex-1">
          {/* Sidebar - Desktop */}
          {isDesktop && (
            <aside className="w-64 border-r bg-gray-50 p-4 flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {userData?.fullName ? getInitials(userData.fullName) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold">{userData?.fullName || userData?.email}</h2>
                  <p className="text-sm text-gray-500">{getUserTitle(userType)}</p>
                </div>
              </div>

              <nav className="space-y-1 flex-1">
                {getNavItems(userType).map((item, index) => (
                  <Link
                    key={index}
                    href={item.href}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>

              <Button variant="outline" className="mt-auto" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </aside>
          )}

          {/* Sidebar - Mobile */}
          {!isDesktop && sidebarOpen && (
            <div className="fixed inset-0 z-50 flex">
              <div className="fixed inset-0 bg-black/50" onClick={toggleSidebar} />
              <aside className="relative w-64 max-w-xs bg-white p-4 flex flex-col h-full">
                <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={toggleSidebar}>
                  <X className="h-5 w-5" />
                </Button>

                <div className="flex items-center gap-2 mb-6 mt-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {userData?.fullName ? getInitials(userData.fullName) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold">{userData?.fullName || userData?.email}</h2>
                    <p className="text-sm text-gray-500">{getUserTitle(userType)}</p>
                  </div>
                </div>

                <nav className="space-y-1 flex-1">
                  {getNavItems(userType).map((item, index) => (
                    <Link
                      key={index}
                      href={item.href}
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 transition-colors"
                      onClick={toggleSidebar}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </nav>

                <Button variant="outline" className="mt-auto" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </aside>
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1 p-4 bg-gray-50">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
