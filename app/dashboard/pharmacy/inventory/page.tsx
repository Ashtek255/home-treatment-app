import { DashboardLayout } from "@/components/dashboard/layout"
import { InventoryContent } from "@/components/dashboard/pharmacy/inventory"

export default function PharmacyInventoryPage() {
  return (
    <DashboardLayout userType="pharmacy">
      <InventoryContent />
    </DashboardLayout>
  )
}
