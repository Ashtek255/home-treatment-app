import { DashboardLayout } from "@/components/dashboard/layout"
import { FindDoctorsContent } from "@/components/dashboard/patient/find-doctors"

export default function FindDoctorsPage() {
  return (
    <DashboardLayout userType="patient">
      <FindDoctorsContent />
    </DashboardLayout>
  )
}
