import { DashboardLayout } from "@/components/dashboard/layout"
import { OrderMedicineContent } from "@/components/dashboard/patient/order-medicine"

export default function OrderMedicinePage() {
  return (
    <DashboardLayout userType="patient">
      <OrderMedicineContent />
    </DashboardLayout>
  )
}
