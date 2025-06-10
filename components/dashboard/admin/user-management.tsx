"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Search, Building, Stethoscope } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AdminUser {
  id: string
  email: string
  userType: "patient" | "doctor" | "pharmacy"
  fullName?: string
  pharmacyName?: string
  verified?: boolean
  createdAt: string
}

interface UserManagementProps {
  users: AdminUser[]
  onDeleteUser: (userId: string) => void
}

export function UserManagement({ users, onDeleteUser }: UserManagementProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "patient" | "doctor" | "pharmacy">("all")
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.fullName && user.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.pharmacyName && user.pharmacyName.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesFilter = filterType === "all" || user.userType === filterType

    return matchesSearch && matchesFilter
  })

  const handleDeleteClick = (userId: string) => {
    if (deleteConfirm === userId) {
      onDeleteUser(userId)
      setDeleteConfirm(null)
    } else {
      setDeleteConfirm(userId)
      // Reset confirmation after 3 seconds
      setTimeout(() => setDeleteConfirm(null), 3000)
    }
  }

  const getUserIcon = (userType: string) => {
    switch (userType) {
      case "patient":
        return <Building className="h-4 w-4" />
      case "doctor":
        return <Stethoscope className="h-4 w-4" />
      case "pharmacy":
        return <Building className="h-4 w-4" />
      default:
        return <Building className="h-4 w-4" />
    }
  }

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case "patient":
        return "bg-blue-100 text-blue-800"
      case "doctor":
        return "bg-green-100 text-green-800"
      case "pharmacy":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterType === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("all")}
            >
              All
            </Button>
            <Button
              variant={filterType === "patient" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("patient")}
            >
              Patients
            </Button>
            <Button
              variant={filterType === "doctor" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("doctor")}
            >
              Doctors
            </Button>
            <Button
              variant={filterType === "pharmacy" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("pharmacy")}
            >
              Pharmacies
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredUsers.length === 0 ? (
          <Alert>
            <AlertDescription>No users found matching your search criteria.</AlertDescription>
          </Alert>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getUserIcon(user.userType)}
                        <span className="font-medium">{user.fullName || user.pharmacyName || "No name"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getUserTypeColor(user.userType)}>{user.userType}</Badge>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.userType === "doctor" ? (
                        <Badge variant={user.verified ? "default" : "secondary"}>
                          {user.verified ? "Approved" : "Pending"}
                        </Badge>
                      ) : (
                        <Badge variant="default">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button
                        variant={deleteConfirm === user.id ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => handleDeleteClick(user.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        {deleteConfirm === user.id ? "Confirm" : "Delete"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
