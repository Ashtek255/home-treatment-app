import { DashboardLayout } from "@/components/dashboard/layout"
import { DoctorAppointmentsContent } from "@/components/dashboard/doctor/appointments"

export default function DoctorAppointmentsPage() {
  return (
    <DashboardLayout userType="doctor">
      <DoctorAppointmentsContent />
    </DashboardLayout>
  )
}
