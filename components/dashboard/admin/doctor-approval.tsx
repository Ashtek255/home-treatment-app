"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle, XCircle, Eye, Stethoscope } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Doctor {
  id: string
  email: string
  fullName?: string
  specialization?: string
  licenseNumber?: string
  experience?: string
  verified?: boolean
  createdAt: string
  cvUrl?: string
  photoUrl?: string
}

interface DoctorApprovalProps {
  doctors: Doctor[]
  onApprove: (doctorId: string) => void
  onReject: (doctorId: string) => void
}

export function DoctorApproval({ doctors, onApprove, onReject }: DoctorApprovalProps) {
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)

  const pendingDoctors = doctors.filter((doctor) => doctor.verified !== true)
  const approvedDoctors = doctors.filter((doctor) => doctor.verified === true)

  const handleApprove = async (doctorId: string) => {
    setProcessing(doctorId)
    try {
      await onApprove(doctorId)
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (doctorId: string) => {
    setProcessing(doctorId)
    try {
      await onReject(doctorId)
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Pending Doctors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Pending Doctor Approvals ({pendingDoctors.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingDoctors.length === 0 ? (
            <Alert>
              <AlertDescription>No pending doctor approvals at this time.</AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Specialization</TableHead>
                    <TableHead>License</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingDoctors.map((doctor) => (
                    <TableRow key={doctor.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{doctor.fullName || "No name"}</div>
                          <div className="text-sm text-muted-foreground">{doctor.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{doctor.specialization || "Not specified"}</TableCell>
                      <TableCell>{doctor.licenseNumber || "Not provided"}</TableCell>
                      <TableCell>{doctor.experience ? `${doctor.experience} years` : "Not specified"}</TableCell>
                      <TableCell>{new Date(doctor.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setSelectedDoctor(doctor)}>
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleApprove(doctor.id)}
                            disabled={processing === doctor.id}
                          >
                            <CheckCircle className="h-4 w-4" />
                            {processing === doctor.id ? "Processing..." : "Approve"}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(doctor.id)}
                            disabled={processing === doctor.id}
                          >
                            <XCircle className="h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approved Doctors */}
      <Card>
        <CardHeader>
          <CardTitle>Approved Doctors ({approvedDoctors.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {approvedDoctors.length === 0 ? (
            <Alert>
              <AlertDescription>No approved doctors yet.</AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Specialization</TableHead>
                    <TableHead>License</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Approved</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvedDoctors.map((doctor) => (
                    <TableRow key={doctor.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{doctor.fullName || "No name"}</div>
                          <div className="text-sm text-muted-foreground">{doctor.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{doctor.specialization || "Not specified"}</TableCell>
                      <TableCell>{doctor.licenseNumber || "Not provided"}</TableCell>
                      <TableCell>
                        <Badge variant="default">Approved</Badge>
                      </TableCell>
                      <TableCell>{new Date(doctor.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Doctor Details Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Doctor Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Full Name</label>
                  <p className="text-sm text-muted-foreground">{selectedDoctor.fullName || "Not provided"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-sm text-muted-foreground">{selectedDoctor.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Specialization</label>
                  <p className="text-sm text-muted-foreground">{selectedDoctor.specialization || "Not specified"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">License Number</label>
                  <p className="text-sm text-muted-foreground">{selectedDoctor.licenseNumber || "Not provided"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Experience</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedDoctor.experience ? `${selectedDoctor.experience} years` : "Not specified"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Applied Date</label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedDoctor.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {selectedDoctor.cvUrl && (
                <div>
                  <label className="text-sm font-medium">CV Document</label>
                  <div className="mt-1">
                    <Button variant="outline" asChild>
                      <a href={selectedDoctor.cvUrl} target="_blank" rel="noopener noreferrer">
                        View CV
                      </a>
                    </Button>
                  </div>
                </div>
              )}

              {selectedDoctor.photoUrl && (
                <div>
                  <label className="text-sm font-medium">Photo</label>
                  <div className="mt-1">
                    <img
                      src={selectedDoctor.photoUrl || "/placeholder.svg"}
                      alt="Doctor photo"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => {
                    handleApprove(selectedDoctor.id)
                    setSelectedDoctor(null)
                  }}
                  disabled={processing === selectedDoctor.id}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleReject(selectedDoctor.id)
                    setSelectedDoctor(null)
                  }}
                  disabled={processing === selectedDoctor.id}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button variant="outline" onClick={() => setSelectedDoctor(null)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
