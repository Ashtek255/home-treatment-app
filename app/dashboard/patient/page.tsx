import { DashboardLayout } from "@/components/dashboard/layout"
import { PatientDashboard } from "@/components/dashboard/patient-dashboard"

export default function PatientDashboardPage() {
  return (
    <DashboardLayout userType="patient">
      <PatientDashboard />
    </DashboardLayout>
  )
}
