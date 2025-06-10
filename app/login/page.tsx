"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FirebaseError } from "firebase/app"
import { browserLocalPersistence, setPersistence } from "firebase/auth"
import { getFirebaseAuth } from "@/lib/firebase"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!isClient) {
        throw new Error("Cannot login on server side")
      }

      // Get the auth instance safely
      const auth = getFirebaseAuth()

      // Set persistence to LOCAL to keep the user logged in
      await setPersistence(auth, browserLocalPersistence)

      // Use the login function from auth context
      await login(email, password)

      // The auth context will handle redirecting to the appropriate dashboard
      router.replace("/dashboard")
    } catch (err) {
      console.error("Login error:", err)
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case "auth/invalid-email":
            setError("Invalid email address format.")
            break
          case "auth/user-disabled":
            setError("This account has been disabled. Please contact support.")
            break
          case "auth/user-not-found":
            setError("No account found with this email. Please check your email or register.")
            break
          case "auth/wrong-password":
            setError("Incorrect password. Please try again.")
            break
          case "auth/too-many-requests":
            setError("Too many unsuccessful login attempts. Please try again later or reset your password.")
            break
          case "auth/network-request-failed":
            setError("Network error. Please check your internet connection and try again.")
            break
          default:
            setError(`Failed to log in: ${err.message}`)
        }
      } else {
        setError(`An unexpected error occurred: ${err instanceof Error ? err.message : String(err)}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="focus:ring-2 focus:ring-primary"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm">
            Don't have an account?{" "}
            <Link href="/" className="text-primary hover:underline">
              Register
            </Link>
          </div>
        </CardFooter>
      </Card>

      <Button variant="ghost" asChild className="mt-4">
        <Link href="/" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </Button>
    </div>
  )
}
