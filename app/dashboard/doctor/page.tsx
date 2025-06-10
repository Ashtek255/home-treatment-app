import { DashboardLayout } from "@/components/dashboard/layout"
import { DoctorDashboard } from "@/components/dashboard/doctor-dashboard"

export default function DoctorDashboardPage() {
  return (
    <DashboardLayout userType="doctor">
      <DoctorDashboard />
    </DashboardLayout>
  )
}
