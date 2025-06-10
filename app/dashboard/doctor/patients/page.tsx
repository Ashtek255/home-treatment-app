import { DashboardLayout } from "@/components/dashboard/layout"
import { PatientsContent } from "@/components/dashboard/doctor/patients"

export default function DoctorPatientsPage() {
  return (
    <DashboardLayout userType="doctor">
      <PatientsContent />
    </DashboardLayout>
  )
}
