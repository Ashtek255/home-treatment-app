"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, Timestamp, addDoc } from "firebase/firestore"
import { getFirebaseFirestore } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Clock, User, FileText, MessageSquare } from "lucide-react"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"

export function DoctorAppointmentsContent() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [showNotesDialog, setShowNotesDialog] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null)
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false)
  const [updateLoading, setUpdateLoading] = useState(false)

  // Replace the mock appointments array with this state
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { userData, user } = useAuth()

  // Add this useEffect to fetch real-time appointments
  useEffect(() => {
    if (!user?.uid) return

    setLoading(true)
    let unsubscribe = () => {}

    try {
      const db = getFirebaseFirestore()

      // Create query for appointments
      const appointmentsQuery = query(
        collection(db, "appointments"),
        where("doctorId", "==", user.uid),
        orderBy("date", "asc"),
        orderBy("time", "asc"),
      )

      // Set up real-time listener
      unsubscribe = onSnapshot(
        appointmentsQuery,
        (snapshot) => {
          const appointmentList: any[] = []
          snapshot.forEach((doc) => {
            appointmentList.push({ id: doc.id, ...doc.data() })
          })
          setAppointments(appointmentList)
          setLoading(false)
        },
        (error) => {
          console.error("Error fetching appointments:", error)
          setLoading(false)
        },
      )
    } catch (err) {
      console.error("Error setting up appointments listener:", err)
      setLoading(false)
    }

    // Clean up listener
    return () => unsubscribe()
  }, [user?.uid])

  // Mock data for appointments
  // const appointments = [
  //   {
  //     id: 1,
  //     patientName: "John Doe",
  //     patientAge: 45,
  //     date: "May 15, 2025",
  //     time: "10:00 AM",
  //     type: "General Checkup",
  //     status: "confirmed",
  //     notes: "Patient has a history of hypertension. Check blood pressure.",
  //   },
  //   {
  //     id: 2,
  //     patientName: "Maria Garcia",
  //     patientAge: 32,
  //     date: "May 15, 2025",
  //     time: "11:30 AM",
  //     type: "Follow-up",
  //     status: "confirmed",
  //     notes: "Follow-up on medication side effects.",
  //   },
  //   {
  //     id: 3,
  //     patientName: "Robert Johnson",
  //     patientAge: 58,
  //     date: "May 16, 2025",
  //     time: "9:15 AM",
  //     type: "Consultation",
  //     status: "pending",
  //     notes: "",
  //   },
  //   {
  //     id: 4,
  //     patientName: "Sarah Williams",
  //     patientAge: 28,
  //     date: "May 16, 2025",
  //     time: "2:30 PM",
  //     type: "General Checkup",
  //     status: "confirmed",
  //     notes: "First-time patient.",
  //   },
  //   {
  //     id: 5,
  //     patientName: "Michael Brown",
  //     patientAge: 40,
  //     date: "May 14, 2025",
  //     time: "3:45 PM",
  //     type: "Follow-up",
  //     status: "completed",
  //     notes: "Patient reported improvement with new medication.",
  //   },
  // ]

  // Filter appointments based on tab
  const filterAppointments = (status: string | string[]) => {
    if (Array.isArray(status)) {
      return appointments.filter((appt) => status.includes(appt.status))
    }
    return appointments.filter((appt) => appt.status === status)
  }

  const upcomingAppointments = [...filterAppointments("pending"), ...filterAppointments("received")]
  const completedAppointments = filterAppointments("completed")

  // Filter appointments for the selected date
  const getAppointmentsForDate = (dateStr: string) => {
    return appointments.filter((appointment) => {
      const appointmentDate =
        appointment.date instanceof Timestamp ? appointment.date.toDate() : new Date(appointment.date)
      return formatDate(appointmentDate) === dateStr
    })
  }

  const formatDate = (date: Date): string => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ]
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
  }

  const todayAppointments = getAppointmentsForDate(formatDate(new Date()))

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "received":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Received</Badge>
      case "pending":
        return (
          <Badge variant="outline" className="text-yellow-800">
            Pending
          </Badge>
        )
      case "completed":
        return <Badge variant="secondary">Completed</Badge>
      case "cancelled":
        return (
          <Badge variant="outline" className="text-red-800">
            Cancelled
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleViewNotes = (appointment: any) => {
    setSelectedAppointment(appointment)
    setShowNotesDialog(true)
  }

  const handleSaveNotes = () => {
    // In a real app, you would send this to your backend
    console.log("Saving notes for appointment:", selectedAppointment)
    setShowNotesDialog(false)
  }

  const handleAppointmentUpdate = async (status: "received" | "cancelled" | "completed") => {
    if (!selectedAppointment) return

    setUpdateLoading(true)

    try {
      const db = getFirebaseFirestore()
      const appointmentRef = doc(db, "appointments", selectedAppointment.id)

      // Update the appointment status
      await updateDoc(appointmentRef, {
        status,
        updatedAt: Timestamp.now(),
      })

      // Create a notification for the patient
      await addDoc(collection(db, "notifications"), {
        userId: selectedAppointment.patientId,
        title: `Appointment ${status}`,
        message: `Your appointment with Dr. ${userData?.fullName} has been ${status}.`,
        read: false,
        createdAt: Timestamp.now(),
        type: "appointment_update",
        appointmentId: selectedAppointment.id,
      })

      // Show success message
      toast({
        title: "Appointment updated",
        description: `Appointment has been ${status} successfully.`,
      })

      setShowAppointmentDialog(false)
      setSelectedAppointment(null)
    } catch (err) {
      console.error("Error updating appointment:", err)
      toast({
        title: "Error",
        description: "Failed to update appointment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdateLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Appointments</h1>

      <Tabs defaultValue="calendar">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="upcoming">
            Upcoming{" "}
            {upcomingAppointments.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {upcomingAppointments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Select Date</CardTitle>
              </CardHeader>
              <CardContent>
                <CalendarComponent mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">{date ? formatDate(date) : "Today's"} Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {date && getAppointmentsForDate(formatDate(date)).length > 0 ? (
                    getAppointmentsForDate(formatDate(date)).map((appointment) => (
                      <div key={appointment.id} className="flex items-start gap-4 p-3 rounded-md border">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <Clock className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <div>
                              <p className="font-medium">{appointment.patientName}</p>
                              <p className="text-sm text-gray-500">
                                {appointment.type} • Age: {appointment.patientAge}
                              </p>
                            </div>
                            {getStatusBadge(appointment.status)}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{appointment.time}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleViewNotes(appointment)}>
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-gray-500">No appointments scheduled for this date.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4 mt-4">
          {upcomingAppointments.length > 0 ? (
            upcomingAppointments.map((appointment) => (
              <Card key={appointment.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{appointment.patientName}</h3>
                          {getStatusBadge(appointment.status)}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span>
                            {formatDate(
                              appointment.date instanceof Timestamp
                                ? appointment.date.toDate()
                                : new Date(appointment.date),
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span>{appointment.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span>
                            Age: {appointment.patientAge} • {appointment.type}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedAppointment(appointment)
                          setShowAppointmentDialog(true)
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-6 text-center">
                <p className="text-gray-500">No upcoming appointments.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-4">
          {completedAppointments.length > 0 ? (
            completedAppointments.map((appointment) => (
              <Card key={appointment.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{appointment.patientName}</h3>
                          {getStatusBadge(appointment.status)}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span>
                            {formatDate(
                              appointment.date instanceof Timestamp
                                ? appointment.date.toDate()
                                : new Date(appointment.date),
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span>{appointment.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span>
                            Age: {appointment.patientAge} • {appointment.type}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => handleViewNotes(appointment)}>
                        <FileText className="h-4 w-4 mr-2" />
                        View Notes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-6 text-center">
                <p className="text-gray-500">No completed appointments.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Appointment Notes Dialog */}
      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Appointment Notes</DialogTitle>
            <DialogDescription>
              {selectedAppointment?.patientName} • {selectedAppointment?.date} at {selectedAppointment?.time}
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Patient Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span> {selectedAppointment.patientName}
                  </div>
                  <div>
                    <span className="text-gray-500">Age:</span> {selectedAppointment.patientAge}
                  </div>
                  <div>
                    <span className="text-gray-500">Appointment Type:</span> {selectedAppointment.type}
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span> {selectedAppointment.status}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Notes</h4>
                <Textarea
                  placeholder="Enter appointment notes here..."
                  rows={5}
                  defaultValue={selectedAppointment.notes}
                />
              </div>

              {selectedAppointment.status === "completed" && (
                <div className="space-y-2">
                  <h4 className="font-medium">Follow-up</h4>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Schedule follow-up?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No follow-up needed</SelectItem>
                      <SelectItem value="1-week">1 week</SelectItem>
                      <SelectItem value="2-weeks">2 weeks</SelectItem>
                      <SelectItem value="1-month">1 month</SelectItem>
                      <SelectItem value="3-months">3 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotesDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNotes}>Save Notes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appointment Details Dialog */}
      <Dialog open={showAppointmentDialog} onOpenChange={() => setShowAppointmentDialog(false)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
            <DialogDescription>
              {selectedAppointment?.patientName} • {selectedAppointment?.date} at {selectedAppointment?.time}
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Patient Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span> {selectedAppointment.patientName}
                  </div>
                  <div>
                    <span className="text-gray-500">Age:</span> {selectedAppointment.patientAge}
                  </div>
                  <div>
                    <span className="text-gray-500">Appointment Type:</span> {selectedAppointment.type}
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span> {selectedAppointment.status}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Notes</h4>
                <Textarea
                  placeholder="Enter appointment notes here..."
                  rows={5}
                  defaultValue={selectedAppointment.notes}
                />
              </div>

              <div className="flex justify-end gap-2">
                {selectedAppointment?.status === "pending" && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleAppointmentUpdate("cancelled")}
                      disabled={updateLoading}
                    >
                      {updateLoading ? "Updating..." : "Decline"}
                    </Button>
                    <Button onClick={() => handleAppointmentUpdate("received")} disabled={updateLoading}>
                      {updateLoading ? "Updating..." : "Accept"}
                    </Button>
                  </>
                )}

                {selectedAppointment?.status === "received" && (
                  <>
                    <Button variant="outline" onClick={() => setShowAppointmentDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => handleAppointmentUpdate("completed")} disabled={updateLoading}>
                      {updateLoading ? "Updating..." : "Mark as Completed"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAppointmentDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
