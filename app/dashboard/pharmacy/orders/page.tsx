import { DashboardLayout } from "@/components/dashboard/layout"
import { OrdersContent } from "@/components/dashboard/pharmacy/orders"

export default function PharmacyOrdersPage() {
  return (
    <DashboardLayout userType="pharmacy">
      <OrdersContent />
    </DashboardLayout>
  )
}
