import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { PatientRegistrationForm } from "@/components/registration/patient-form"
import { DoctorRegistrationForm } from "@/components/registration/doctor-form"
import { PharmacyRegistrationForm } from "@/components/registration/pharmacy-form"

export default function RegisterPage({ params }: { params: { type: string } }) {
  const userType = params.type

  const renderForm = () => {
    switch (userType) {
      case "patient":
        return <PatientRegistrationForm />
      case "doctor":
        return <DoctorRegistrationForm />
      case "pharmacy":
        return <PharmacyRegistrationForm />
      default:
        return (
          <div className="text-center p-4">
            <p>Invalid user type. Please go back and select a valid user type.</p>
            <Button asChild className="mt-4">
              <Link href="/">Go Back</Link>
            </Button>
          </div>
        )
    }
  }

  const getTitle = () => {
    switch (userType) {
      case "patient":
        return "Patient Registration"
      case "doctor":
        return "Doctor Registration"
      case "pharmacy":
        return "Pharmacy Registration"
      default:
        return "Registration"
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">{getTitle()}</CardTitle>
          <CardDescription>Create your account to access healthcare services</CardDescription>
        </CardHeader>
        <CardContent>{renderForm()}</CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Login
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
