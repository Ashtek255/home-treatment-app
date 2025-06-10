import { DashboardLayout } from "@/components/dashboard/layout"
import { MessagesContent } from "@/components/dashboard/messages"

export default function PatientMessagesPage() {
  return (
    <DashboardLayout userType="patient">
      <MessagesContent userType="patient" />
    </DashboardLayout>
  )
}
