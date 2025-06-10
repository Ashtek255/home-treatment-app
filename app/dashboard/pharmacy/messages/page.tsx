import { DashboardLayout } from "@/components/dashboard/layout"
import { MessagesContent } from "@/components/dashboard/messages"

export default function PharmacyMessagesPage() {
  return (
    <DashboardLayout userType="pharmacy">
      <MessagesContent userType="pharmacy" />
    </DashboardLayout>
  )
}
