"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { UserCheck, Stethoscope, Building2 } from "lucide-react"

const userTypes = [
  {
    type: "patient",
    title: "Patient",
    description: "Book appointments and order medicines",
    icon: UserCheck,
    color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    type: "doctor",
    title: "Doctor",
    description: "Manage patients and appointments",
    icon: Stethoscope,
    color: "bg-green-50 border-green-200 hover:bg-green-100",
    iconColor: "text-green-600",
  },
  {
    type: "pharmacy",
    title: "Pharmacy",
    description: "Manage inventory and orders",
    icon: Building2,
    color: "bg-purple-50 border-purple-200 hover:bg-purple-100",
    iconColor: "text-purple-600",
  },
]

export function UserTypeSelection() {
  return (
    <div className="w-full space-y-4">
      <div className="text-center">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Choose Your Role</h3>
        <p className="text-sm text-gray-600">Select how you'd like to use our platform</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        {userTypes.map((userType) => {
          const IconComponent = userType.icon
          return (
            <Card
              key={userType.type}
              className={`${userType.color} transition-all duration-200 hover:shadow-md cursor-pointer group`}
            >
              <Link href={`/register/${userType.type}`} className="block">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className={`flex-shrink-0 p-2 sm:p-3 rounded-full bg-white shadow-sm`}>
                      <IconComponent className={`h-5 w-5 sm:h-6 sm:w-6 ${userType.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base sm:text-lg font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                        {userType.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">{userType.description}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto py-2 px-3 text-xs sm:text-sm font-medium group-hover:bg-white/50 transition-colors"
                      >
                        Sign Up
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
