"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, User, MessageSquare, Bell } from "lucide-react"

interface Appointment {
  id: string
  patientId: string
  patientName: string
  date: string
  time: string
  type: string
  status: "pending" | "received" | "completed" | "cancelled"
  reason?: string
  createdAt: any
}

export function DoctorDashboard() {
  const { user } = useAuth()
  const [isAvailable, setIsAvailable] = useState(true)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    // Set up real-time appointments listener
    const appointmentsQuery = query(
      collection(db, "appointments"),
      where("doctorId", "==", user.uid),
      orderBy("date", "asc"),
      orderBy("time", "asc"),
    )

    const unsubscribe = onSnapshot(appointmentsQuery, (snapshot) => {
      const appointmentsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Appointment[]

      setAppointments(appointmentsList)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  // Filter appointments for today
  const today = new Date().toISOString().split("T")[0]
  const todaysAppointments = appointments.filter((apt) => apt.date === today && apt.status === "received")

  // Filter pending appointments
  const pendingAppointments = appointments.filter((apt) => apt.status === "pending")

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold">Doctor Dashboard</h1>

        <div className="flex items-center space-x-2">
          <Switch id="availability" checked={isAvailable} onCheckedChange={setIsAvailable} />
          <Label htmlFor="availability" className="font-medium">
            {isAvailable ? "Available for Requests" : "Unavailable"}
          </Label>
        </div>
      </div>

      {/* Today's Schedule */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Today's Schedule</h2>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{new Date().toLocaleDateString()}</CardTitle>
            <CardDescription>
              You have {todaysAppointments.length} appointment{todaysAppointments.length !== 1 ? "s" : ""} today
            </CardDescription>
          </CardHeader>
          <CardContent>
            {todaysAppointments.length > 0 ? (
              <div className="space-y-4">
                {todaysAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-start gap-4 p-3 rounded-md border">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{appointment.patientName}</p>
                      <p className="text-sm text-gray-500">{appointment.type}</p>
                      <p className="text-sm text-gray-500">{appointment.time}</p>
                      {appointment.reason && <p className="text-sm text-gray-600 mt-1">{appointment.reason}</p>}
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      Confirmed
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Appointments Today</h3>
                <p className="text-gray-500">Your schedule is clear for today.</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/dashboard/doctor/appointments">View All Appointments</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Pending Appointment Requests */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          New Appointment Requests
          {pendingAppointments.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              <Bell className="h-3 w-3 mr-1" />
              {pendingAppointments.length}
            </Badge>
          )}
        </h2>

        {pendingAppointments.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {pendingAppointments.map((request) => (
              <Card key={request.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between">
                    <CardTitle className="text-lg">{request.patientName}</CardTitle>
                    <span className="text-sm text-gray-500">
                      {request.createdAt?.toDate?.()?.toLocaleString() || "Just now"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        {request.date} at {request.time}
                      </span>
                    </div>
                    <p className="text-sm">
                      <span className="font-medium">Type:</span> {request.type}
                    </p>
                    {request.reason && (
                      <p className="text-sm">
                        <span className="font-medium">Reason:</span> {request.reason}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 mt-2">
                    Pending
                  </Badge>
                </CardContent>
                <CardFooter className="flex justify-between gap-2">
                  <Button variant="outline" className="flex-1">
                    Decline
                  </Button>
                  <Button className="flex-1">Accept</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No New Requests</h3>
              <p className="text-gray-500">New appointment requests will appear here.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              My Patients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>View and manage your patient records</CardDescription>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/dashboard/doctor/patients">View Patients</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              All Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>Manage all your appointments and schedule</CardDescription>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/dashboard/doctor/appointments">Manage Schedule</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>View and respond to patient messages</CardDescription>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/dashboard/doctor/messages">View Messages</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
