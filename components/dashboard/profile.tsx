"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, User, Shield, Mail } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { doc, updateDoc } from "firebase/firestore"
import { ref, getDownloadURL, uploadBytesResumable } from "firebase/storage"
import { db, storage } from "@/lib/firebase"
import Link from "next/link"

export function ProfileContent() {
  const { user, userData, updateUserData } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    address: "",
    bio: "",
    // Additional fields based on user type
    specialization: "",
    experience: "",
    licenseNumber: "",
    pharmacyName: "",
  })

  // Set isClient to true when component mounts on client
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (userData && isClient) {
      // Populate form with existing user data
      setFormData({
        fullName: userData.fullName || "",
        phoneNumber: userData.phoneNumber || "",
        address: userData.address || "",
        bio: userData.bio || "",
        specialization: userData.specialization || "",
        experience: userData.experience || "",
        licenseNumber: userData.licenseNumber || "",
        pharmacyName: userData.pharmacyName || "",
      })

      // Set profile image URL if it exists
      setProfileImageUrl(userData.photoUrl || null)
    }
  }, [userData, isClient])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size exceeds 5MB limit")
        return
      }

      setProfileImage(file)
      // Create a preview URL
      const url = URL.createObjectURL(file)
      setProfileImageUrl(url)
    }
  }

  const uploadProfileImage = async () => {
    if (!profileImage || !user) return

    setLoading(true)
    setError(null)

    try {
      const storageRef = ref(storage, `users/${user.uid}/profile`)
      const uploadTask = uploadBytesResumable(storageRef, profileImage)

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // You could add a progress indicator here if desired
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          console.log(`Upload is ${progress}% done`)
        },
        (error) => {
          console.error("Upload error:", error)
          setError("Failed to upload image. Please try again.")
          setLoading(false)
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
            await updateUserData({ photoUrl: downloadURL })
            setSuccess(true)
            setLoading(false)
          } catch (error) {
            console.error("Error getting download URL:", error)
            setError("Failed to update profile picture. Please try again.")
            setLoading(false)
          }
        },
      )
    } catch (error) {
      console.error("Error starting upload:", error)
      setError("Failed to start upload. Please try again.")
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)

    try {
      if (!user) {
        throw new Error("User not authenticated")
      }

      const photoUrl = userData?.photoUrl || null

      // Upload profile image if selected
      if (profileImage) {
        await uploadProfileImage()
        // The photoUrl will be updated by the uploadProfileImage function
        // so we don't need to set it here
      } else {
        // Update user data in Firestore
        const userDocRef = doc(db, "users", user.uid)

        // Create an object with only the fields relevant to the user type
        const updateData: any = {
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          address: formData.address,
          bio: formData.bio,
          photoUrl,
        }

        // Add fields based on user type
        if (userData?.userType === "doctor") {
          updateData.specialization = formData.specialization
          updateData.experience = formData.experience
          updateData.licenseNumber = formData.licenseNumber
        } else if (userData?.userType === "pharmacy") {
          updateData.pharmacyName = formData.pharmacyName
          updateData.licenseNumber = formData.licenseNumber
        }

        await updateDoc(userDocRef, updateData)

        // Update local user data
        await updateUserData(updateData)

        setSuccess(true)
      }
    } catch (err) {
      console.error("Error updating profile:", err)
      setError("Failed to update profile. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
  }

  // Don't render anything on the server
  if (!isClient) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Profile</h1>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 text-green-800 border-green-200">
          <AlertDescription>Profile updated successfully!</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile Information</TabsTrigger>
          <TabsTrigger value="account">Account Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information and profile picture</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-24 w-24 border-2 border-primary/20">
                    <AvatarImage src={profileImageUrl || ""} alt={userData?.fullName || "User"} />
                    <AvatarFallback>{userData?.fullName ? getInitials(userData.fullName) : "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-2 items-center">
                    <Input
                      id="profileImage"
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/*"
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("profileImage")?.click()}
                      className="flex items-center gap-2"
                      disabled={loading}
                    >
                      <Upload className="h-4 w-4" />
                      Change Profile Picture
                    </Button>
                    {profileImage && (
                      <div className="text-sm text-gray-500">
                        {profileImage.name} ({(profileImage.size / 1024).toFixed(1)} KB)
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Enter your address"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      placeholder="Tell us about yourself"
                      rows={3}
                    />
                  </div>

                  {/* Doctor-specific fields */}
                  {userData?.userType === "doctor" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="specialization">Specialization</Label>
                        <Input
                          id="specialization"
                          name="specialization"
                          value={formData.specialization}
                          onChange={handleChange}
                          placeholder="E.g., Pediatrics, Cardiology"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="experience">Years of Experience</Label>
                        <Input
                          id="experience"
                          name="experience"
                          type="number"
                          value={formData.experience}
                          onChange={handleChange}
                          placeholder="Enter years of experience"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="licenseNumber">License Number</Label>
                        <Input
                          id="licenseNumber"
                          name="licenseNumber"
                          value={formData.licenseNumber}
                          onChange={handleChange}
                          placeholder="Enter your medical license number"
                        />
                      </div>
                    </>
                  )}

                  {/* Pharmacy-specific fields */}
                  {userData?.userType === "pharmacy" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="pharmacyName">Pharmacy Name</Label>
                        <Input
                          id="pharmacyName"
                          name="pharmacyName"
                          value={formData.pharmacyName}
                          onChange={handleChange}
                          placeholder="Enter pharmacy name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="licenseNumber">License Number</Label>
                        <Input
                          id="licenseNumber"
                          name="licenseNumber"
                          value={formData.licenseNumber}
                          onChange={handleChange}
                          placeholder="Enter pharmacy license number"
                        />
                      </div>
                    </>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your account settings and email preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">Email Address</p>
                      <p className="text-sm text-gray-500">{userData?.email}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    Change Email
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">Password</p>
                      <p className="text-sm text-gray-500">Last changed: Never</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/forgot-password">Reset Password</Link>
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">Account Type</p>
                      <p className="text-sm text-gray-500 capitalize">{userData?.userType}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
