"use client"

import { Label } from "@/components/ui/label"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, User, AlertCircle, CheckCircle, XCircle, RefreshCcw } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase"
import { collection, query, where, doc, updateDoc, orderBy, onSnapshot, Timestamp } from "firebase/firestore"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface Appointment {
  id: string
  patientId: string
  patientName: string
  doctorId: string
  doctorName: string
  doctorSpecialization: string
  date: string
  time: string
  reason: string
  status: "pending" | "confirmed" | "cancelled" | "completed"
  notes?: string
  cancellationReason?: string
  createdAt: Timestamp
}

export function AppointmentsContent() {
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([])
  const [pastAppointments, setPastAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [appointmentToCancel, setAppointmentToCancel] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (!user) return

    setLoading(true)
    setError(null)

    // Modified query to avoid requiring a composite index
    // Only filter by patientId and use a single orderBy
    const appointmentsQuery = query(
      collection(db, "appointments"),
      where("patientId", "==", user.uid),
      orderBy("date"), // Single orderBy to avoid index issues
    )

    const unsubscribe = onSnapshot(
      appointmentsQuery,
      (snapshot) => {
        const appointments: Appointment[] = []
        const upcoming: Appointment[] = []
        const past: Appointment[] = []

        // Get current date as string for comparison
        const today = new Date()
        const todayStr = format(today, "yyyy-MM-dd")

        snapshot.forEach((doc) => {
          const data = doc.data() as Omit<Appointment, "id">
          const appointment: Appointment = {
            id: doc.id,
            ...data,
            createdAt: data.createdAt || Timestamp.now(),
          }

          appointments.push(appointment)
        })

        // Sort appointments in JavaScript instead of in the query
        appointments.sort((a, b) => {
          // First by date
          const dateComparison = a.date.localeCompare(b.date)
          if (dateComparison !== 0) return dateComparison

          // Then by time if dates are equal
          return convertTo24Hour(a.time).localeCompare(convertTo24Hour(b.time))
        })

        // Separate into upcoming and past
        appointments.forEach((appointment) => {
          if (
            appointment.status === "cancelled" ||
            appointment.status === "completed" ||
            appointment.date < todayStr ||
            (appointment.date === todayStr && convertTo24Hour(appointment.time) < getCurrentTime())
          ) {
            past.push(appointment)
          } else {
            upcoming.push(appointment)
          }
        })

        // Sort past appointments by date and time (newest first)
        past.sort((a, b) => {
          // First by date (descending)
          const dateComparison = b.date.localeCompare(a.date)
          if (dateComparison !== 0) return dateComparison

          // Then by time if dates are equal (descending)
          return convertTo24Hour(b.time).localeCompare(convertTo24Hour(a.time))
        })

        setUpcomingAppointments(upcoming)
        setPastAppointments(past)
        setLoading(false)
        setRefreshing(false)
      },
      (err) => {
        console.error("Error fetching appointments:", err)
        setError("Failed to load appointments. Please try again.")
        setLoading(false)
        setRefreshing(false)
      },
    )

    return () => unsubscribe()
  }, [user])

  // Helper function to convert time like "10:00" to 24-hour format for comparison
  const convertTo24Hour = (timeStr: string) => {
    if (timeStr.includes("AM") || timeStr.includes("PM")) {
      // Already in 12-hour format, convert to 24-hour
      const [time, modifier] = timeStr.split(" ")
      let [hours, minutes] = time.split(":")

      if (hours === "12") {
        hours = "00"
      }

      if (modifier === "PM") {
        hours = (Number.parseInt(hours, 10) + 12).toString()
      }

      return `${hours.padStart(2, "0")}:${minutes}`
    }

    return timeStr // already in 24-hour format
  }

  // Get current time in 24-hour format
  const getCurrentTime = () => {
    const now = new Date()
    return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`
  }

  const handleCancelAppointment = async () => {
    if (!appointmentToCancel) return

    setCancelling(true)

    try {
      await updateDoc(doc(db, "appointments", appointmentToCancel), {
        status: "cancelled",
        cancellationReason: cancelReason || "Cancelled by patient",
        updatedAt: Timestamp.now(),
      })

      toast({
        title: "Appointment cancelled",
        description: "Your appointment has been cancelled successfully.",
      })

      setShowCancelDialog(false)
      setCancelReason("")
    } catch (err) {
      console.error("Error cancelling appointment:", err)
      toast({
        title: "Cancellation failed",
        description: "Failed to cancel your appointment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCancelling(false)
      setAppointmentToCancel(null)
    }
  }

  const formatAppointmentTime = (time: string) => {
    // If time is already in 12-hour format, return it
    if (time.includes("AM") || time.includes("PM")) {
      return time
    }

    // Convert 24-hour format to 12-hour format
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)

    if (hour === 0) {
      return `12:${minutes} AM`
    } else if (hour < 12) {
      return `${hour}:${minutes} AM`
    } else if (hour === 12) {
      return `12:${minutes} PM`
    } else {
      return `${hour - 12}:${minutes} PM`
    }
  }

  const refreshAppointments = () => {
    setRefreshing(true)
    // The actual refresh happens via the onSnapshot listener in the useEffect
  }

  const viewAppointmentDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setShowDetailsDialog(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Confirmed</Badge>
      case "pending":
        return (
          <Badge variant="outline" className="text-yellow-800 border-yellow-300 bg-yellow-50">
            Pending
          </Badge>
        )
      case "completed":
        return <Badge variant="secondary">Completed</Badge>
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatAppointmentDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split("-").map(Number)
      const date = new Date(year, month - 1, day)
      return format(date, "MMMM d, yyyy")
    } catch (e) {
      return dateStr
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Appointments</h1>
        <Button variant="outline" size="sm" onClick={refreshAppointments} disabled={loading || refreshing}>
          <RefreshCcw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex gap-2 items-center text-red-800">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="upcoming">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming">
            Upcoming
            {upcomingAppointments.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {upcomingAppointments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="past">
            Past
            {pastAppointments.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pastAppointments.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4 mt-4">
          {loading ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">Loading your appointments...</p>
              </CardContent>
            </Card>
          ) : upcomingAppointments.length > 0 ? (
            upcomingAppointments.map((appointment) => (
              <Card key={appointment.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{getInitials(appointment.doctorName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{appointment.doctorName}</CardTitle>
                        <CardDescription>{appointment.doctorSpecialization}</CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(appointment.status)}
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>{formatAppointmentDate(appointment.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>{formatAppointmentTime(appointment.time)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span>{appointment.reason}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => viewAppointmentDetails(appointment)}>
                    <User className="h-4 w-4 mr-2" />
                    Details
                  </Button>
                  {appointment.status === "confirmed" || appointment.status === "pending" ? (
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        setAppointmentToCancel(appointment.id)
                        setShowCancelDialog(true)
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  ) : (
                    <Button variant="secondary" className="flex-1" disabled>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-6 text-center">
                <p className="text-gray-500 mb-4">You have no upcoming appointments</p>
                <Button onClick={() => (window.location.href = "/dashboard/patient/find-doctors")}>
                  Book an Appointment
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4 mt-4">
          {loading ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">Loading your appointments...</p>
              </CardContent>
            </Card>
          ) : pastAppointments.length > 0 ? (
            pastAppointments.map((appointment) => (
              <Card key={appointment.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{getInitials(appointment.doctorName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{appointment.doctorName}</CardTitle>
                        <CardDescription>{appointment.doctorSpecialization}</CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(appointment.status)}
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>{formatAppointmentDate(appointment.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>{formatAppointmentTime(appointment.time)}</span>
                    </div>
                    <div className="flex items-center gap-2 col-span-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="truncate">{appointment.reason}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="flex gap-2 w-full">
                    <Button variant="outline" className="flex-1" onClick={() => viewAppointmentDetails(appointment)}>
                      Details
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => (window.location.href = "/dashboard/patient/find-doctors")}
                    >
                      Book Again
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-6 text-center">
                <p className="text-gray-500">You have no past appointments</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Cancel Appointment Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this appointment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="cancel-reason">Reason for cancellation (optional)</Label>
            <Textarea
              id="cancel-reason"
              placeholder="Please provide a reason for cancellation"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Never mind</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleCancelAppointment()
              }}
              disabled={cancelling}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelling ? "Cancelling..." : "Cancel Appointment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Appointment Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-md">
          {selectedAppointment && (
            <>
              <DialogHeader>
                <DialogTitle>Appointment Details</DialogTitle>
                <DialogDescription>View your appointment information</DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>{getInitials(selectedAppointment.doctorName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{selectedAppointment.doctorName}</h3>
                    <p className="text-sm text-gray-500">{selectedAppointment.doctorSpecialization}</p>
                  </div>
                  <div className="ml-auto">{getStatusBadge(selectedAppointment.status)}</div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-1">
                    <div className="text-sm font-medium">Date:</div>
                    <div className="text-sm col-span-2">{formatAppointmentDate(selectedAppointment.date)}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <div className="text-sm font-medium">Time:</div>
                    <div className="text-sm col-span-2">{formatAppointmentTime(selectedAppointment.time)}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <div className="text-sm font-medium">Reason:</div>
                    <div className="text-sm col-span-2">{selectedAppointment.reason}</div>
                  </div>

                  {selectedAppointment.status === "cancelled" && selectedAppointment.cancellationReason && (
                    <div className="grid grid-cols-3 gap-1">
                      <div className="text-sm font-medium">Cancelled:</div>
                      <div className="text-sm col-span-2">{selectedAppointment.cancellationReason}</div>
                    </div>
                  )}

                  {selectedAppointment.notes && (
                    <div className="grid grid-cols-3 gap-1">
                      <div className="text-sm font-medium">Notes:</div>
                      <div className="text-sm col-span-2">{selectedAppointment.notes}</div>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                {selectedAppointment.status === "confirmed" || selectedAppointment.status === "pending" ? (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setAppointmentToCancel(selectedAppointment.id)
                      setShowDetailsDialog(false)
                      setShowCancelDialog(true)
                    }}
                  >
                    Cancel Appointment
                  </Button>
                ) : (
                  <Button onClick={() => setShowDetailsDialog(false)}>Close</Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
