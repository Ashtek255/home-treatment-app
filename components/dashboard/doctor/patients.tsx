"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Search, User, Calendar, FileText, MessageSquare, Clock, Plus } from "lucide-react"

export function PatientsContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showPatientDialog, setShowPatientDialog] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<(typeof patients)[0] | null>(null)

  // Mock data for patients
  const patients = [
    {
      id: 1,
      name: "John Doe",
      age: 45,
      gender: "Male",
      phone: "+255 712 345 678",
      email: "john.doe@example.com",
      lastVisit: "May 10, 2025",
      nextAppointment: "May 15, 2025",
      medicalHistory: "Hypertension, Diabetes Type 2",
      medications: ["Lisinopril 10mg", "Metformin 500mg"],
      notes: "Patient has been managing blood pressure well with current medication.",
      status: "active",
    },
    {
      id: 2,
      name: "Maria Garcia",
      age: 32,
      gender: "Female",
      phone: "+255 765 432 109",
      email: "maria.garcia@example.com",
      lastVisit: "April 28, 2025",
      nextAppointment: "May 20, 2025",
      medicalHistory: "Asthma",
      medications: ["Albuterol Inhaler"],
      notes: "Patient experiences occasional asthma attacks during weather changes.",
      status: "active",
    },
    {
      id: 3,
      name: "Robert Johnson",
      age: 58,
      gender: "Male",
      phone: "+255 789 012 345",
      email: "robert.johnson@example.com",
      lastVisit: "March 15, 2025",
      nextAppointment: "May 16, 2025",
      medicalHistory: "Coronary Artery Disease, Hyperlipidemia",
      medications: ["Atorvastatin 20mg", "Aspirin 81mg"],
      notes: "Patient needs regular monitoring of cholesterol levels.",
      status: "active",
    },
    {
      id: 4,
      name: "Sarah Williams",
      age: 28,
      gender: "Female",
      phone: "+255 732 109 876",
      email: "sarah.williams@example.com",
      lastVisit: "Never",
      nextAppointment: "May 16, 2025",
      medicalHistory: "None",
      medications: [],
      notes: "First-time patient coming for general checkup.",
      status: "new",
    },
    {
      id: 5,
      name: "Michael Brown",
      age: 40,
      gender: "Male",
      phone: "+255 754 321 098",
      email: "michael.brown@example.com",
      lastVisit: "February 5, 2025",
      nextAppointment: "None",
      medicalHistory: "Anxiety Disorder",
      medications: ["Sertraline 50mg"],
      notes: "Patient reported improvement with current medication.",
      status: "inactive",
    },
  ]

  // Filter patients based on search and tab
  const filterPatients = (status: string) => {
    return patients.filter(
      (patient) =>
        (patient.status === status || status === "all") &&
        (patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          patient.medicalHistory.toLowerCase().includes(searchQuery.toLowerCase())),
    )
  }

  const activePatients = filterPatients("active")
  const newPatients = filterPatients("new")
  const inactivePatients = filterPatients("inactive")

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
      case "new":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">New</Badge>
      case "inactive":
        return <Badge variant="outline">Inactive</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleViewPatient = (patient: (typeof patients)[0]) => {
    setSelectedPatient(patient)
    setShowPatientDialog(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Patients</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Patient
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          placeholder="Search patients by name or medical history..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Tabs defaultValue="active">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">
            Active{" "}
            {activePatients.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activePatients.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="new">
            New{" "}
            {newPatients.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {newPatients.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
        </TabsList>

        {["active", "new", "inactive"].map((status) => (
          <TabsContent key={status} value={status} className="space-y-4 mt-4">
            {filterPatients(status).length > 0 ? (
              filterPatients(status).map((patient) => (
                <Card key={patient.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{patient.name}</h3>
                            {getStatusBadge(patient.status)}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span>
                              {patient.age} years • {patient.gender}
                            </span>
                          </div>
                          {patient.lastVisit !== "Never" && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <span>Last visit: {patient.lastVisit}</span>
                            </div>
                          )}
                          {patient.nextAppointment !== "None" && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <span>Next appointment: {patient.nextAppointment}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 md:col-span-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <span className="truncate">History: {patient.medicalHistory}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => handleViewPatient(patient)}>
                          View Details
                        </Button>
                        <Button variant="outline">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-6 text-center">
                  <p className="text-gray-500">No {status} patients found.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Patient Details Dialog */}
      <Dialog open={showPatientDialog} onOpenChange={setShowPatientDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Patient Details</DialogTitle>
            <DialogDescription>
              {selectedPatient?.name} • {selectedPatient?.age} years • {selectedPatient?.gender}
            </DialogDescription>
          </DialogHeader>

          {selectedPatient && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Contact Information</h4>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-gray-500">Phone:</span> {selectedPatient.phone}
                    </p>
                    <p>
                      <span className="text-gray-500">Email:</span> {selectedPatient.email}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Appointments</h4>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-gray-500">Last Visit:</span> {selectedPatient.lastVisit}
                    </p>
                    <p>
                      <span className="text-gray-500">Next Appointment:</span> {selectedPatient.nextAppointment}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Medical History</h4>
                <p className="text-sm">{selectedPatient.medicalHistory || "No medical history recorded."}</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Current Medications</h4>
                {selectedPatient.medications.length > 0 ? (
                  <ul className="list-disc list-inside text-sm">
                    {selectedPatient.medications.map((medication, index) => (
                      <li key={index}>{medication}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm">No current medications.</p>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Notes</h4>
                <Textarea defaultValue={selectedPatient.notes} rows={3} />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPatientDialog(false)}>
              Close
            </Button>
            <Button>Update Patient</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
