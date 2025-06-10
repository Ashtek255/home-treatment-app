import { DashboardLayout } from "@/components/dashboard/layout"
import { PharmacyDashboard } from "@/components/dashboard/pharmacy-dashboard"

export default function PharmacyDashboardPage() {
  return (
    <DashboardLayout userType="pharmacy">
      <PharmacyDashboard />
    </DashboardLayout>
  )
}
