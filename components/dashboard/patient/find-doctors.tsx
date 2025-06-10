"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin, Star, Calendar, Info, CheckCircle, Loader2 } from "lucide-react"
import { getFirebaseFirestore } from "@/lib/firebase"
import { collection, query, where, doc, setDoc, serverTimestamp, getDoc, onSnapshot, addDoc } from "firebase/firestore"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"

export function FindDoctorsContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const [specialization, setSpecialization] = useState("")
  const [distance, setDistance] = useState([10])
  const [rating, setRating] = useState("")
  const [availability, setAvailability] = useState("")
  const [doctors, setDoctors] = useState<any[]>([])
  const [specializations, setSpecializations] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [booking, setBooking] = useState<{ loading: boolean; doctor: any | null }>({
    loading: false,
    doctor: null,
  })
  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [bookingDate, setBookingDate] = useState("")
  const [bookingTime, setBookingTime] = useState("")
  const [bookingReason, setBookingReason] = useState("")
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    // Get today's date in YYYY-MM-DD format for the min date of the date input
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, "0")
    const day = String(today.getDate()).padStart(2, "0")
    setBookingDate(`${year}-${month}-${day}`)
  }, [])

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true)
      setError(null)

      try {
        const db = getFirebaseFirestore()

        // Create a query to get all users with userType = "doctor"
        const doctorsRef = collection(db, "users")
        const doctorsQuery = query(doctorsRef, where("userType", "==", "doctor"))

        // Set up real-time listener
        const unsubscribe = onSnapshot(
          doctorsQuery,
          (snapshot) => {
            const doctorsList: any[] = []
            const specializationsList = new Set<string>()

            snapshot.forEach((doc) => {
              const doctorData = doc.data()

              // Only add doctors with at least a name
              if (doctorData.fullName) {
                if (doctorData.specialization) {
                  specializationsList.add(doctorData.specialization)
                }

                doctorsList.push({
                  id: doc.id,
                  name: doctorData.fullName,
                  specialization: doctorData.specialization || "General Physician",
                  distance: calculateDistance(doctorData.location), // Calculate based on location if available
                  rating: doctorData.rating || 4.0,
                  available: doctorData.available !== false, // Default to available unless explicitly set false
                  photoUrl: doctorData.photoUrl || null,
                  experience: doctorData.experience || "N/A",
                  bio: doctorData.bio || "Experienced healthcare professional dedicated to providing quality care.",
                  consultationFee: doctorData.consultationFee || "$30-50",
                  email: doctorData.email,
                  phone: doctorData.phone,
                  createdAt: doctorData.createdAt,
                })
              }
            })

            setDoctors(doctorsList)
            setSpecializations(Array.from(specializationsList))
            setLoading(false)
          },
          (err) => {
            console.error("Error fetching doctors:", err)
            setError("Failed to load doctors. Please try again.")
            setLoading(false)
          },
        )

        // Clean up listener on unmount
        return () => unsubscribe()
      } catch (err) {
        console.error("Error setting up doctors listener:", err)
        setError("Failed to load doctors. Please try again.")
        setLoading(false)
      }
    }

    fetchDoctors()
  }, [])

  // Helper function to calculate distance (mock for now)
  const calculateDistance = (location: any) => {
    // In a real app, you would calculate distance based on user's location
    // For now, return a random distance between 0.5 and 15 km
    return Math.round((Math.random() * 14.5 + 0.5) * 10) / 10
  }

  const filteredDoctors = doctors.filter((doctor) => {
    // Filter by search query (name or specialization)
    const matchesSearch =
      searchQuery === "" ||
      doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.specialization.toLowerCase().includes(searchQuery.toLowerCase())

    // Filter by specialization
    const matchesSpecialization = specialization === "" || doctor.specialization === specialization

    // Filter by distance
    const matchesDistance = doctor.distance <= distance[0]

    // Filter by rating
    const matchesRating = rating === "" || doctor.rating >= Number.parseFloat(rating || "0")

    // Filter by availability
    const matchesAvailability =
      availability === "" ||
      (availability === "available" && doctor.available) ||
      (availability === "unavailable" && !doctor.available)

    return matchesSearch && matchesSpecialization && matchesDistance && matchesRating && matchesAvailability
  })

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
  }

  const handleBookAppointment = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please login to book an appointment",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    if (!selectedDoctor) return

    if (!bookingDate || !bookingTime || !bookingReason) {
      toast({
        title: "Missing information",
        description: "Please fill all appointment details",
        variant: "destructive",
      })
      return
    }

    setBooking({ loading: true, doctor: selectedDoctor })

    try {
      const db = getFirebaseFirestore()

      // Check if the patient document exists
      const patientRef = doc(db, "users", user.uid)
      const patientSnap = await getDoc(patientRef)

      if (!patientSnap.exists()) {
        throw new Error("Patient profile not found")
      }

      const patientData = patientSnap.data()

      // Generate appointment ID
      const appointmentId = doc(collection(db, "appointments")).id

      // Create appointment in Firestore
      const appointmentData = {
        id: appointmentId,
        patientId: user.uid,
        patientName: patientData.fullName || user.displayName || user.email,
        patientEmail: user.email,
        patientPhone: patientData.phoneNumber || "Not provided",
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        doctorSpecialization: selectedDoctor.specialization,
        date: bookingDate,
        time: bookingTime,
        reason: bookingReason,
        status: "pending", // pending, received, completed
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      await setDoc(doc(db, "appointments", appointmentId), appointmentData)

      // Create a notification for the doctor
      await addDoc(collection(db, "notifications"), {
        userId: selectedDoctor.id,
        title: "New Appointment Request",
        message: `${patientData.fullName || user.displayName || user.email} has requested an appointment on ${bookingDate} at ${bookingTime}.`,
        read: false,
        createdAt: serverTimestamp(),
        type: "new_appointment",
        appointmentId: appointmentId,
      })

      setBookingSuccess(true)
      toast({
        title: "Appointment request sent",
        description: "Your appointment has been requested successfully",
      })

      // Clear form
      setBookingDate(new Date().toISOString().split("T")[0])
      setBookingTime("")
      setBookingReason("")
    } catch (err) {
      console.error("Error booking appointment:", err)
      toast({
        title: "Booking failed",
        description: err instanceof Error ? err.message : "Failed to book appointment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setBooking({ loading: false, doctor: null })
    }
  }

  const viewDoctorProfile = (doctor: any) => {
    setSelectedDoctor(doctor)
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Find Doctors</h1>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search and Filter</CardTitle>
          <CardDescription>Find the right doctor for your needs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Input
                id="search"
                placeholder="Search by name or specialization"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setSearchQuery("")}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Specialization Filter */}
            <div className="space-y-2">
              <Label htmlFor="specialization">Specialization</Label>
              <Select value={specialization} onValueChange={setSpecialization}>
                <SelectTrigger id="specialization">
                  <SelectValue placeholder="Any Specialization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Specialization</SelectItem>
                  {specializations.map((spec) => (
                    <SelectItem key={spec} value={spec}>
                      {spec}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Distance Filter */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Maximum Distance</Label>
                <span className="text-sm">{distance[0]} km</span>
              </div>
              <Slider defaultValue={[10]} max={20} step={1} value={distance} onValueChange={setDistance} />
            </div>

            {/* Rating Filter */}
            <div className="space-y-2">
              <Label htmlFor="rating">Minimum Rating</Label>
              <Select value={rating} onValueChange={setRating}>
                <SelectTrigger id="rating">
                  <SelectValue placeholder="Any Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Rating</SelectItem>
                  <SelectItem value="3">3+ Stars</SelectItem>
                  <SelectItem value="4">4+ Stars</SelectItem>
                  <SelectItem value="4.5">4.5+ Stars</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Availability Filter */}
            <div className="space-y-2">
              <Label htmlFor="availability">Availability</Label>
              <Select value={availability} onValueChange={setAvailability}>
                <SelectTrigger id="availability">
                  <SelectValue placeholder="Any Availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Availability</SelectItem>
                  <SelectItem value="available">Available Now</SelectItem>
                  <SelectItem value="unavailable">Not Available</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          {loading ? "Loading Doctors..." : `${filteredDoctors.length} Doctors Found`}
        </h2>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">Loading doctor profiles...</p>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">No doctors found matching your criteria</p>
              <Button
                className="mt-4"
                onClick={() => {
                  setSearchQuery("")
                  setSpecialization("")
                  setDistance([10])
                  setRating("")
                  setAvailability("")
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDoctors.map((doctor) => (
              <Card key={doctor.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12 border border-primary/20">
                      <AvatarImage src={doctor.photoUrl || ""} alt={doctor.name} />
                      <AvatarFallback className="bg-primary/10">{getInitials(doctor.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{doctor.name}</CardTitle>
                      <CardDescription>{doctor.specialization}</CardDescription>
                      <div className="flex items-center gap-1 text-sm mt-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span>{doctor.rating}/5</span>
                        {doctor.experience !== "N/A" && <span className="ml-2">{doctor.experience} years exp.</span>}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                    <MapPin className="h-4 w-4" />
                    <span>{doctor.distance.toFixed(1)} km away</span>
                    {doctor.consultationFee && (
                      <>
                        <span className="mx-2">•</span>
                        <span>Fee: {doctor.consultationFee}</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm line-clamp-2">{doctor.bio}</p>
                  <div className="mt-2">
                    <span
                      className={`text-sm px-2 py-1 rounded-full ${
                        doctor.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {doctor.available ? "Available Now" : "Unavailable"}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button
                    className="flex-1"
                    variant={doctor.available ? "default" : "outline"}
                    disabled={!doctor.available || booking.loading}
                    onClick={() => {
                      setSelectedDoctor(doctor)
                      setIsDialogOpen(true)
                    }}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Book Appointment
                  </Button>
                  <Button variant="outline" onClick={() => viewDoctorProfile(doctor)}>
                    <Info className="h-4 w-4" />
                    <span className="sr-only md:not-sr-only md:ml-2">View Profile</span>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Doctor Profile and Booking Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl overflow-auto max-h-[90vh]">
          {selectedDoctor && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">Dr. {selectedDoctor.name}</DialogTitle>
                <DialogDescription>Book an appointment or view doctor details</DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="booking" className="mt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="booking">Book Appointment</TabsTrigger>
                  <TabsTrigger value="profile">Doctor Profile</TabsTrigger>
                </TabsList>

                <TabsContent value="booking" className="space-y-4 mt-4">
                  {bookingSuccess ? (
                    <div className="text-center p-6">
                      <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <h3 className="text-lg font-medium">Appointment Requested</h3>
                      <p className="text-gray-500 mt-2 mb-4">
                        Your appointment request has been submitted. You will receive a confirmation once the doctor
                        approves.
                      </p>
                      <Button
                        onClick={() => {
                          setIsDialogOpen(false)
                          setBookingSuccess(false)
                          router.push("/dashboard/patient/appointments")
                        }}
                      >
                        View My Appointments
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="booking-date">Appointment Date</Label>
                          <Input
                            id="booking-date"
                            type="date"
                            value={bookingDate}
                            onChange={(e) => setBookingDate(e.target.value)}
                            min={new Date().toISOString().split("T")[0]}
                            max={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="booking-time">Preferred Time</Label>
                          <Select value={bookingTime} onValueChange={setBookingTime}>
                            <SelectTrigger id="booking-time">
                              <SelectValue placeholder="Select a time" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="09:00">9:00 AM</SelectItem>
                              <SelectItem value="10:00">10:00 AM</SelectItem>
                              <SelectItem value="11:00">11:00 AM</SelectItem>
                              <SelectItem value="12:00">12:00 PM</SelectItem>
                              <SelectItem value="13:00">1:00 PM</SelectItem>
                              <SelectItem value="14:00">2:00 PM</SelectItem>
                              <SelectItem value="15:00">3:00 PM</SelectItem>
                              <SelectItem value="16:00">4:00 PM</SelectItem>
                              <SelectItem value="17:00">5:00 PM</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="booking-reason">Reason for Visit</Label>
                        <Input
                          id="booking-reason"
                          placeholder="Brief description of your health concern"
                          value={bookingReason}
                          onChange={(e) => setBookingReason(e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div className="border rounded-md p-4 bg-gray-50">
                        <h4 className="font-medium mb-2">Appointment Summary</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>Doctor:</div>
                          <div className="font-medium">{selectedDoctor.name}</div>
                          <div>Specialization:</div>
                          <div>{selectedDoctor.specialization}</div>
                          <div>Consultation Fee:</div>
                          <div>{selectedDoctor.consultationFee}</div>
                        </div>
                      </div>

                      <DialogFooter className="flex items-center justify-between sm:justify-end">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button disabled={booking.loading} onClick={handleBookAppointment}>
                          {booking.loading ? "Sending Request..." : "Book Appointment"}
                        </Button>
                      </DialogFooter>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="profile" className="space-y-4 mt-4">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-shrink-0">
                      <Avatar className="h-24 w-24 border border-primary/20">
                        <AvatarImage src={selectedDoctor.photoUrl || ""} alt={selectedDoctor.name} />
                        <AvatarFallback className="bg-primary/10 text-lg">
                          {getInitials(selectedDoctor.name)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold">{selectedDoctor.name}</h3>
                      <p className="text-gray-500">{selectedDoctor.specialization}</p>

                      <div className="flex items-center gap-1 mt-2">
                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                        <span className="font-medium">{selectedDoctor.rating}/5</span>
                      </div>

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div className="font-medium">Experience:</div>
                        <div>{selectedDoctor.experience} years</div>
                        <div className="font-medium">Consultation Fee:</div>
                        <div>{selectedDoctor.consultationFee}</div>
                        <div className="font-medium">Availability:</div>
                        <div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs ${
                              selectedDoctor.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}
                          >
                            {selectedDoctor.available ? "Available Now" : "Unavailable"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4">
                        <h4 className="font-medium mb-1">About</h4>
                        <p className="text-gray-700">{selectedDoctor.bio}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const tab = document.querySelector('[value="booking"]')
                        if (tab instanceof HTMLElement) {
                          tab.click()
                        }
                      }}
                    >
                      Book an Appointment
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
