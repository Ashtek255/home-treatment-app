import { DashboardLayout } from "@/components/dashboard/layout"
import { AppointmentsContent } from "@/components/dashboard/patient/appointments"

export default function AppointmentsPage() {
  return (
    <DashboardLayout userType="patient">
      <AppointmentsContent />
    </DashboardLayout>
  )
}
