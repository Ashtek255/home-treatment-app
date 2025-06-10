"use client"

import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { User, Mail, Phone, MapPin, Heart } from "lucide-react"
import { useState } from "react"

export function PatientProfileContent() {
  const { userData } = useAuth()
  const [isEditing, setIsEditing] = useState(false)

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
  }

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-red-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Patient Profile</h1>
        <Button variant={isEditing ? "outline" : "default"} onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? "Cancel" : "Edit Profile"}
        </Button>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <Avatar className={`h-32 w-32 ${userData?.fullName ? getAvatarColor(userData.fullName) : "bg-gray-500"}`}>
              <AvatarFallback className="text-white text-3xl font-bold">
                {userData?.fullName ? getInitials(userData.fullName) : <User className="h-16 w-16" />}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-bold">{userData?.fullName || "Patient Name"}</h2>
              <p className="text-xl text-muted-foreground">Patient</p>
              <div className="flex flex-wrap gap-4 mt-4 justify-center md:justify-start">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4" />
                  {userData?.email}
                </div>
                {userData?.phoneNumber && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4" />
                    {userData.phoneNumber}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" value={userData?.fullName || ""} disabled={!isEditing} placeholder="Full name" />
            </div>
            <div>
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input id="dateOfBirth" type="date" value={userData?.dateOfBirth || ""} disabled={!isEditing} />
            </div>
            <div>
              <Label htmlFor="gender">Gender</Label>
              <Input id="gender" value={userData?.gender || ""} disabled={!isEditing} placeholder="Gender" />
            </div>
            <div>
              <Label htmlFor="bloodType">Blood Type</Label>
              <Input
                id="bloodType"
                value={userData?.bloodType || ""}
                disabled={!isEditing}
                placeholder="e.g., A+, O-, B+"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" value={userData?.phoneNumber || ""} disabled={!isEditing} placeholder="Phone number" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={userData?.email || ""} disabled={true} placeholder="Email address" />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Home Address</Label>
            <Textarea
              id="address"
              value={userData?.address || ""}
              disabled={!isEditing}
              placeholder="Full home address..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Emergency Contact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="emergencyName">Emergency Contact Name</Label>
              <Input
                id="emergencyName"
                value={userData?.emergencyContactName || ""}
                disabled={!isEditing}
                placeholder="Contact person name"
              />
            </div>
            <div>
              <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
              <Input
                id="emergencyPhone"
                value={userData?.emergencyContactPhone || ""}
                disabled={!isEditing}
                placeholder="Emergency contact number"
              />
            </div>
            <div>
              <Label htmlFor="emergencyRelation">Relationship</Label>
              <Input
                id="emergencyRelation"
                value={userData?.emergencyContactRelation || ""}
                disabled={!isEditing}
                placeholder="e.g., Spouse, Parent, Sibling"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medical Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Medical Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="allergies">Allergies</Label>
            <Textarea
              id="allergies"
              value={userData?.allergies || ""}
              disabled={!isEditing}
              placeholder="List any known allergies..."
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="medications">Current Medications</Label>
            <Textarea
              id="medications"
              value={userData?.currentMedications || ""}
              disabled={!isEditing}
              placeholder="List current medications..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="conditions">Medical Conditions</Label>
            <Textarea
              id="conditions"
              value={userData?.medicalConditions || ""}
              disabled={!isEditing}
              placeholder="List any ongoing medical conditions..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {isEditing && (
        <div className="flex gap-4">
          <Button className="flex-1">Save Changes</Button>
          <Button variant="outline" className="flex-1" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}
