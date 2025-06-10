import { DashboardLayout } from "@/components/dashboard/layout"
import { MessagesContent } from "@/components/dashboard/messages"

export default function DoctorMessagesPage() {
  return (
    <DashboardLayout userType="doctor">
      <MessagesContent userType="doctor" />
    </DashboardLayout>
  )
}
