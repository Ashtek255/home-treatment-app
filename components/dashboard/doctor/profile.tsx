"use client"

import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { User, Mail, Phone, MapPin, Stethoscope, GraduationCap } from "lucide-react"
import { useState } from "react"

export function DoctorProfileContent() {
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
        <h1 className="text-2xl font-bold">Doctor Profile</h1>
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
              <h2 className="text-3xl font-bold">{userData?.fullName || "Dr. Name"}</h2>
              <p className="text-xl text-muted-foreground">{userData?.specialization || "Specialization"}</p>
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

      {/* Professional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Professional Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="specialization">Specialization</Label>
              <Input
                id="specialization"
                value={userData?.specialization || ""}
                disabled={!isEditing}
                placeholder="e.g., Cardiology, Pediatrics"
              />
            </div>
            <div>
              <Label htmlFor="experience">Years of Experience</Label>
              <Input
                id="experience"
                value={userData?.experience || ""}
                disabled={!isEditing}
                placeholder="e.g., 10 years"
              />
            </div>
            <div>
              <Label htmlFor="license">Medical License Number</Label>
              <Input
                id="license"
                value={userData?.licenseNumber || ""}
                disabled={!isEditing}
                placeholder="License number"
              />
            </div>
            <div>
              <Label htmlFor="hospital">Hospital/Clinic</Label>
              <Input
                id="hospital"
                value={userData?.hospital || ""}
                disabled={!isEditing}
                placeholder="Primary workplace"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="bio">Professional Bio</Label>
            <Textarea
              id="bio"
              value={userData?.bio || ""}
              disabled={!isEditing}
              placeholder="Tell patients about your background and expertise..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Education & Qualifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Education & Qualifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="education">Medical Degree</Label>
            <Input
              id="education"
              value={userData?.education || ""}
              disabled={!isEditing}
              placeholder="e.g., MD from Harvard Medical School"
            />
          </div>
          <div>
            <Label htmlFor="certifications">Certifications</Label>
            <Textarea
              id="certifications"
              value={userData?.certifications || ""}
              disabled={!isEditing}
              placeholder="List your medical certifications..."
              rows={3}
            />
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
            <Label htmlFor="address">Clinic Address</Label>
            <Textarea
              id="address"
              value={userData?.address || ""}
              disabled={!isEditing}
              placeholder="Full clinic address..."
              rows={2}
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
