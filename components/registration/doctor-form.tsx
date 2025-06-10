"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FirebaseError } from "firebase/app"
import { doc, setDoc } from "firebase/firestore"
import { db, storage } from "@/lib/firebase"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

const validatePassword = (password: string): { valid: boolean; message: string } => {
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters" }
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one uppercase letter" }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain at least one number" }
  }
  return { valid: true, message: "" }
}

const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function DoctorRegistrationForm() {
  const router = useRouter()
  const { signup } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
    licenseNumber: "",
    specialization: "",
    experience: "",
    bio: "",
    cv: null as File | null,
    photo: null as File | null,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: "cv" | "photo") => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, [fieldName]: e.target.files?.[0] || null }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setUploadProgress(null)

    // Enhanced validation
    if (!formData.fullName.trim()) {
      setError("Full name is required")
      return
    }

    if (!formData.email.trim()) {
      setError("Email is required")
      return
    }

    if (!isValidEmail(formData.email)) {
      setError("Please enter a valid email address")
      return
    }

    if (!formData.phoneNumber.trim()) {
      setError("Phone number is required")
      return
    }

    if (!formData.licenseNumber.trim()) {
      setError("License number is required")
      return
    }

    if (!formData.specialization.trim()) {
      setError("Specialization is required")
      return
    }

    if (!formData.experience || Number(formData.experience) < 0) {
      setError("Please enter valid years of experience")
      return
    }

    if (!formData.bio.trim()) {
      setError("Professional bio is required")
      return
    }

    const passwordValidation = validatePassword(formData.password)
    if (!passwordValidation.valid) {
      setError(passwordValidation.message)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (!formData.cv || !formData.photo) {
      setError("Please upload both CV and photo")
      return
    }

    // File size validation (5MB limit)
    if (formData.cv.size > 5 * 1024 * 1024) {
      setError("CV file size must be less than 5MB")
      return
    }

    if (formData.photo.size > 2 * 1024 * 1024) {
      setError("Photo file size must be less than 2MB")
      return
    }

    setLoading(true)

    try {
      setUploadProgress("Creating user account...")
      const user = await signup(formData.email, formData.password, "doctor")

      let cvUrl = ""
      let photoUrl = ""

      if (formData.cv) {
        setUploadProgress("Uploading CV...")
        const cvRef = ref(storage, `doctors/${user.uid}/cv`)
        await uploadBytes(cvRef, formData.cv)
        cvUrl = await getDownloadURL(cvRef)
      }

      if (formData.photo) {
        setUploadProgress("Uploading photo...")
        const photoRef = ref(storage, `doctors/${user.uid}/photo`)
        await uploadBytes(photoRef, formData.photo)
        photoUrl = await getDownloadURL(photoRef)
      }

      setUploadProgress("Saving profile information...")
      const userData = {
        fullName: formData.fullName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        licenseNumber: formData.licenseNumber.trim(),
        specialization: formData.specialization.trim(),
        experience: Number(formData.experience),
        bio: formData.bio.trim(),
        cvUrl,
        photoUrl,
        userType: "doctor",
        verified: false,
        profileCompleted: true,
        createdAt: new Date().toISOString(),
      }

      await setDoc(doc(db, "users", user.uid), userData, { merge: true })

      setUploadProgress("Registration complete! Redirecting...")
      router.push("/dashboard/doctor")
    } catch (err) {
      console.error("Registration error:", err)

      if (err instanceof FirebaseError) {
        switch (err.code) {
          case "auth/email-already-in-use":
            setError("Email is already in use. Please login instead.")
            break
          case "auth/invalid-email":
            setError("Invalid email address.")
            break
          case "auth/weak-password":
            setError("Password is too weak.")
            break
          case "storage/unauthorized":
            setError("File upload failed: You don't have permission to upload files.")
            break
          case "storage/canceled":
            setError("File upload was cancelled.")
            break
          case "storage/unknown":
            setError("An unknown error occurred during file upload.")
            break
          case "auth/network-request-failed":
            setError("Network error. Please check your connection and try again.")
            break
          default:
            setError(`Registration failed: ${err.code} - ${err.message}`)
        }
      } else {
        setError(`An unexpected error occurred: ${err instanceof Error ? err.message : String(err)}`)
      }
    } finally {
      setLoading(false)
      setUploadProgress(null)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {uploadProgress && !error && (
          <Alert className="bg-blue-50 text-blue-800 border-blue-200">
            <AlertDescription className="text-sm">{uploadProgress}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-medium">
              Full Name
            </Label>
            <Input
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              className="w-full"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="text-sm font-medium">
              Phone Number
            </Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="Enter your phone number"
              className="w-full"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            className="w-full"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="licenseNumber" className="text-sm font-medium">
              License Number
            </Label>
            <Input
              id="licenseNumber"
              name="licenseNumber"
              value={formData.licenseNumber}
              onChange={handleChange}
              placeholder="Enter your medical license number"
              className="w-full"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialization" className="text-sm font-medium">
              Specialization
            </Label>
            <Input
              id="specialization"
              name="specialization"
              value={formData.specialization}
              onChange={handleChange}
              placeholder="E.g., Pediatrics, Cardiology"
              className="w-full"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="experience" className="text-sm font-medium">
            Years of Experience
          </Label>
          <Input
            id="experience"
            name="experience"
            type="number"
            value={formData.experience}
            onChange={handleChange}
            placeholder="Enter years of experience"
            className="w-full"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio" className="text-sm font-medium">
            Professional Bio
          </Label>
          <Textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            placeholder="Brief description of your professional background"
            rows={3}
            className="w-full resize-none"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cv" className="text-sm font-medium">
              Upload CV
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="cv"
                name="cv"
                type="file"
                onChange={(e) => handleFileChange(e, "cv")}
                className="hidden"
                accept=".pdf,.doc,.docx"
                required
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("cv")?.click()}
                className="w-full h-auto py-2 px-3 text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Upload className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{formData.cv ? formData.cv.name : "Choose CV File"}</span>
                </div>
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="photo" className="text-sm font-medium">
              Upload Photo
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="photo"
                name="photo"
                type="file"
                onChange={(e) => handleFileChange(e, "photo")}
                className="hidden"
                accept="image/*"
                required
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("photo")?.click()}
                className="w-full h-auto py-2 px-3 text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Upload className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{formData.photo ? formData.photo.name : "Choose Photo"}</span>
                </div>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              className="w-full"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              className="w-full"
              required
            />
          </div>
        </div>

        <Button type="submit" className="w-full h-auto py-3 px-4 text-base font-medium" disabled={loading}>
          <span className="flex items-center justify-center gap-2">
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {uploadProgress || "Registering..."}
              </>
            ) : (
              "Register as Doctor"
            )}
          </span>
        </Button>
      </form>
    </div>
  )
}
