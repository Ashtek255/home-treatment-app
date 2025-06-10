"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { UserCog, Pill, Calendar, Search, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Appointment {
  id: string
  doctorId: string
  doctorName: string
  doctorSpecialty?: string
  date: string
  time: string
  type: string
  status: "pending" | "received" | "completed" | "cancelled"
  reason?: string
  createdAt: any
}

interface Doctor {
  id: string
  fullName: string
  specialization: string
  photoUrl?: string
  verified: boolean
  available?: boolean
}

export function PatientDashboard() {
  const [searchQuery, setSearchQuery] = useState("")
  const { userData, updateUserData, user } = useAuth()
  const [isClient, setIsClient] = useState(false)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!user) return

    // Set up real-time appointments listener
    const appointmentsQuery = query(
      collection(db, "appointments"),
      where("patientId", "==", user.uid),
      orderBy("createdAt", "desc"),
    )

    const unsubscribeAppointments = onSnapshot(appointmentsQuery, (snapshot) => {
      const appointmentsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Appointment[]

      setAppointments(appointmentsList)
    })

    // Set up real-time doctors listener
    const doctorsQuery = query(
      collection(db, "users"),
      where("userType", "==", "doctor"),
      where("verified", "==", true),
    )

    const unsubscribeDoctors = onSnapshot(doctorsQuery, (snapshot) => {
      const doctorsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Doctor[]

      setDoctors(doctorsList.slice(0, 3)) // Show only first 3 doctors
      setIsLoading(false)
    })

    return () => {
      unsubscribeAppointments()
      unsubscribeDoctors()
    }
  }, [user])

  const getInitials = (name: string | undefined | null) => {
    if (!name || typeof name !== "string") return "U"

    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
  }

  // Filter upcoming appointments
  const upcomingAppointments = appointments.filter(
    (apt) => apt.status === "received" && new Date(`${apt.date} ${apt.time}`) > new Date(),
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Welcome Back{userData?.fullName ? `, ${userData.fullName}` : ""}!</h1>

      {/* Profile Section */}
      {isClient && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Your Profile</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-24 w-24 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                  {userData?.fullName ? getInitials(userData.fullName) : <User />}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1">
              <div className="space-y-1">
                <h3 className="font-medium">{userData?.fullName || "Complete Your Profile"}</h3>
                <p className="text-sm text-gray-500">{userData?.email}</p>
                {userData?.phoneNumber && <p className="text-sm text-gray-500">{userData.phoneNumber}</p>}
              </div>
              <div className="mt-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard/patient/profile">Edit Profile</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          placeholder="Search for doctors, medicines, or services..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Find a Doctor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>Find and book appointments with qualified doctors near you</CardDescription>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/dashboard/patient/find-doctors">Find Doctors</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Order Medicine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>Order prescription and over-the-counter medicines for delivery</CardDescription>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/dashboard/patient/order-medicine">Order Now</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              My Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>View and manage your upcoming doctor appointments</CardDescription>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/dashboard/patient/appointments">View Appointments</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Available Doctors */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Available Doctors</h2>
          <Button variant="ghost" asChild>
            <Link href="/dashboard/patient/find-doctors">View All</Link>
          </Button>
        </div>

        {doctors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctors.map((doctor) => (
              <Card key={doctor.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={doctor.photoUrl || ""} alt={doctor.fullName || "Doctor"} />
                      <AvatarFallback>{getInitials(doctor.fullName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{doctor.fullName || "Unknown Doctor"}</CardTitle>
                      <CardDescription>{doctor.specialization || "General Practice"}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="mt-2">
                    <span className="text-sm px-2 py-1 rounded-full bg-green-100 text-green-800">Verified</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full">
                    <Link href="/dashboard/patient/find-doctors">Book Appointment</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <UserCog className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Doctors Available</h3>
              <p className="text-gray-500 mb-4">No verified doctors are currently available.</p>
              <Button asChild>
                <Link href="/dashboard/patient/find-doctors">Browse All Doctors</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upcoming Appointments */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Upcoming Appointments</h2>

        {upcomingAppointments.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {upcomingAppointments.map((appointment) => (
              <Card key={appointment.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{appointment.doctorName}</CardTitle>
                  <CardDescription>{appointment.doctorSpecialty || appointment.type}</CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {appointment.date} at {appointment.time}
                    </span>
                  </div>
                  {appointment.reason && (
                    <p className="text-sm mt-1">
                      <strong>Reason:</strong> {appointment.reason}
                    </p>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline">Reschedule</Button>
                  <Button variant="destructive">Cancel</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Upcoming Appointments</h3>
              <p className="text-gray-500 mb-4">You have no upcoming appointments scheduled.</p>
              <Button asChild>
                <Link href="/dashboard/patient/find-doctors">Book an Appointment</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
