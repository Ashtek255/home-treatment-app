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

export function PharmacyRegistrationForm() {
  const router = useRouter()
  const { signup } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    pharmacyName: "",
    ownerName: "",
    phoneNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
    licenseNumber: "",
    address: "",
    description: "",
    logo: null as File | null,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, logo: e.target.files?.[0] || null }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Enhanced validation
    if (!formData.pharmacyName.trim()) {
      setError("Pharmacy name is required")
      return
    }

    if (!formData.ownerName.trim()) {
      setError("Owner/Manager name is required")
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

    if (!formData.address.trim()) {
      setError("Address is required")
      return
    }

    if (!formData.description.trim()) {
      setError("Description is required")
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

    // File size validation if logo is provided
    if (formData.logo && formData.logo.size > 2 * 1024 * 1024) {
      setError("Logo file size must be less than 2MB")
      return
    }

    setLoading(true)

    try {
      // Create user with Firebase Authentication
      const user = await signup(formData.email, formData.password, "pharmacy")

      // Upload logo if it exists
      let logoUrl = ""

      if (formData.logo) {
        const logoRef = ref(storage, `pharmacies/${user.uid}/logo`)
        await uploadBytes(logoRef, formData.logo)
        logoUrl = await getDownloadURL(logoRef)
      }

      // Save additional user data to Firestore
      await setDoc(
        doc(db, "users", user.uid),
        {
          pharmacyName: formData.pharmacyName.trim(),
          ownerName: formData.ownerName.trim(),
          phoneNumber: formData.phoneNumber.trim(),
          licenseNumber: formData.licenseNumber.trim(),
          address: formData.address.trim(),
          description: formData.description.trim(),
          logoUrl,
          userType: "pharmacy",
          verified: false,
          profileCompleted: true,
          createdAt: new Date().toISOString(),
        },
        { merge: true },
      )

      // Redirect to pharmacy dashboard
      router.push("/dashboard/pharmacy")
    } catch (err) {
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
          case "auth/network-request-failed":
            setError("Network error. Please check your connection and try again.")
            break
          default:
            setError(`Registration failed: ${err.message}`)
        }
      } else {
        setError("An unexpected error occurred. Please try again.")
      }
    } finally {
      setLoading(false)
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pharmacyName" className="text-sm font-medium">
              Pharmacy Name
            </Label>
            <Input
              id="pharmacyName"
              name="pharmacyName"
              value={formData.pharmacyName}
              onChange={handleChange}
              placeholder="Enter pharmacy name"
              className="w-full"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ownerName" className="text-sm font-medium">
              Owner/Manager Name
            </Label>
            <Input
              id="ownerName"
              name="ownerName"
              value={formData.ownerName}
              onChange={handleChange}
              placeholder="Enter owner or manager name"
              className="w-full"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="text-sm font-medium">
              Phone Number
            </Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="Enter pharmacy phone number"
              className="w-full"
              required
            />
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
              placeholder="Enter pharmacy email"
              className="w-full"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="licenseNumber" className="text-sm font-medium">
            Pharmacy License Number
          </Label>
          <Input
            id="licenseNumber"
            name="licenseNumber"
            value={formData.licenseNumber}
            onChange={handleChange}
            placeholder="Enter pharmacy license number"
            className="w-full"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address" className="text-sm font-medium">
            Physical Address
          </Label>
          <Textarea
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Enter detailed physical address"
            rows={2}
            className="w-full resize-none"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium">
            Pharmacy Description
          </Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Brief description of your pharmacy and services"
            rows={3}
            className="w-full resize-none"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="logo" className="text-sm font-medium">
            Upload Pharmacy Logo (Optional)
          </Label>
          <div className="flex items-center gap-2">
            <Input id="logo" name="logo" type="file" onChange={handleFileChange} className="hidden" accept="image/*" />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById("logo")?.click()}
              className="w-full h-auto py-2 px-3 text-sm"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Upload className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{formData.logo ? formData.logo.name : "Choose Logo Image"}</span>
              </div>
            </Button>
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
                Registering...
              </>
            ) : (
              "Register as Pharmacy"
            )}
          </span>
        </Button>
      </form>
    </div>
  )
}
