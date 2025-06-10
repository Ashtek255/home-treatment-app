"use client"

import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Building2, Mail, Phone, MapPin, Clock, Shield } from "lucide-react"
import { useState } from "react"

export function PharmacyProfileContent() {
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
        <h1 className="text-2xl font-bold">Pharmacy Profile</h1>
        <Button variant={isEditing ? "outline" : "default"} onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? "Cancel" : "Edit Profile"}
        </Button>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <Avatar
              className={`h-32 w-32 ${userData?.pharmacyName ? getAvatarColor(userData.pharmacyName) : "bg-gray-500"}`}
            >
              <AvatarFallback className="text-white text-3xl font-bold">
                {userData?.pharmacyName ? getInitials(userData.pharmacyName) : <Building2 className="h-16 w-16" />}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-bold">{userData?.pharmacyName || "Pharmacy Name"}</h2>
              <p className="text-xl text-muted-foreground">{userData?.ownerName || "Owner Name"}</p>
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

      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Business Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pharmacyName">Pharmacy Name</Label>
              <Input
                id="pharmacyName"
                value={userData?.pharmacyName || ""}
                disabled={!isEditing}
                placeholder="Pharmacy name"
              />
            </div>
            <div>
              <Label htmlFor="ownerName">Owner Name</Label>
              <Input
                id="ownerName"
                value={userData?.ownerName || ""}
                disabled={!isEditing}
                placeholder="Owner/Manager name"
              />
            </div>
            <div>
              <Label htmlFor="license">Pharmacy License</Label>
              <Input
                id="license"
                value={userData?.licenseNumber || ""}
                disabled={!isEditing}
                placeholder="License number"
              />
            </div>
            <div>
              <Label htmlFor="established">Established Year</Label>
              <Input
                id="established"
                value={userData?.establishedYear || ""}
                disabled={!isEditing}
                placeholder="e.g., 2010"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Business Description</Label>
            <Textarea
              id="description"
              value={userData?.description || ""}
              disabled={!isEditing}
              placeholder="Describe your pharmacy services..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Operating Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Operating Hours
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="weekdayHours">Weekday Hours</Label>
              <Input
                id="weekdayHours"
                value={userData?.weekdayHours || ""}
                disabled={!isEditing}
                placeholder="e.g., 9:00 AM - 9:00 PM"
              />
            </div>
            <div>
              <Label htmlFor="weekendHours">Weekend Hours</Label>
              <Input
                id="weekendHours"
                value={userData?.weekendHours || ""}
                disabled={!isEditing}
                placeholder="e.g., 10:00 AM - 6:00 PM"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="specialHours">Special Hours/Holidays</Label>
            <Textarea
              id="specialHours"
              value={userData?.specialHours || ""}
              disabled={!isEditing}
              placeholder="Any special operating hours or holiday schedules..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact & Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Contact & Location
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
            <Label htmlFor="address">Pharmacy Address</Label>
            <Textarea
              id="address"
              value={userData?.address || ""}
              disabled={!isEditing}
              placeholder="Full pharmacy address..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Services */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Services Offered
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="services">Available Services</Label>
            <Textarea
              id="services"
              value={userData?.services || ""}
              disabled={!isEditing}
              placeholder="List services like prescription filling, consultations, delivery, etc..."
              rows={4}
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
