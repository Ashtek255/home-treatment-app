"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "@/hooks/use-toast"
import {
  Users,
  UserCheck,
  ShoppingCart,
  Calendar,
  Plus,
  Search,
  Filter,
  Trash2,
  CheckCircle,
  XCircle,
  Activity,
  Eye,
  Building,
  Stethoscope,
} from "lucide-react"
import { collection, onSnapshot, doc, deleteDoc, updateDoc, addDoc } from "firebase/firestore"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { getFirebaseFirestore, getFirebaseAuth } from "@/lib/firebase"

interface User {
  id: string
  email: string
  userType: "patient" | "doctor" | "pharmacy"
  fullName?: string
  pharmacyName?: string
  createdAt: any
  profileCompleted?: boolean
  verified?: boolean
  status?: string
  specialization?: string
  licenseNumber?: string
  experience?: string
  cv?: string
  photo?: string
}

interface Analytics {
  totalUsers: number
  totalPatients: number
  totalDoctors: number
  totalPharmacies: number
  approvedDoctors: number
  pendingDoctors: number
  totalOrders: number
  totalAppointments: number
}

export function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [analytics, setAnalytics] = useState<Analytics>({
    totalUsers: 0,
    totalPatients: 0,
    totalDoctors: 0,
    totalPharmacies: 0,
    approvedDoctors: 0,
    pendingDoctors: 0,
    totalOrders: 0,
    totalAppointments: 0,
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [loading, setLoading] = useState(true)
  const [newUserDialog, setNewUserDialog] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState<User | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)
  const [newUserForm, setNewUserForm] = useState({
    email: "",
    password: "",
    userType: "patient" as "patient" | "doctor" | "pharmacy",
    fullName: "",
    phoneNumber: "",
  })

  useEffect(() => {
    const db = getFirebaseFirestore()

    // Listen to users collection
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersData = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }) as User)
        .filter((user) => user.userType !== "admin") // Exclude admin users from the list

      setUsers(usersData)

      // Calculate analytics
      const totalUsers = usersData.length
      const totalPatients = usersData.filter((u) => u.userType === "patient").length
      const totalDoctors = usersData.filter((u) => u.userType === "doctor").length
      const totalPharmacies = usersData.filter((u) => u.userType === "pharmacy").length
      const approvedDoctors = usersData.filter((u) => u.userType === "doctor" && u.verified === true).length
      const pendingDoctors = usersData.filter((u) => u.userType === "doctor" && u.verified !== true).length

      setAnalytics((prev) => ({
        ...prev,
        totalUsers,
        totalPatients,
        totalDoctors,
        totalPharmacies,
        approvedDoctors,
        pendingDoctors,
      }))

      setLoading(false)
    })

    // Listen to orders collection for analytics
    const unsubscribeOrders = onSnapshot(collection(db, "orders"), (snapshot) => {
      setAnalytics((prev) => ({
        ...prev,
        totalOrders: snapshot.docs.length,
      }))
    })

    // Listen to appointments collection for analytics
    const unsubscribeAppointments = onSnapshot(collection(db, "appointments"), (snapshot) => {
      setAnalytics((prev) => ({
        ...prev,
        totalAppointments: snapshot.docs.length,
      }))
    })

    return () => {
      unsubscribeUsers()
      unsubscribeOrders()
      unsubscribeAppointments()
    }
  }, [])

  const handleDeleteUser = async (userId: string) => {
    try {
      const db = getFirebaseFirestore()
      await deleteDoc(doc(db, "users", userId))
      toast({
        title: "Success",
        description: "User deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting user:", error)
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      })
    }
  }

  const handleApproveDoctor = async (doctorId: string) => {
    setProcessing(doctorId)
    try {
      const db = getFirebaseFirestore()
      await updateDoc(doc(db, "users", doctorId), {
        verified: true,
        approvedAt: new Date().toISOString(),
      })
      toast({
        title: "Success",
        description: "Doctor approved successfully",
      })
    } catch (error) {
      console.error("Error approving doctor:", error)
      toast({
        title: "Error",
        description: "Failed to approve doctor",
        variant: "destructive",
      })
    } finally {
      setProcessing(null)
    }
  }

  const handleRejectDoctor = async (doctorId: string) => {
    setProcessing(doctorId)
    try {
      const db = getFirebaseFirestore()
      await updateDoc(doc(db, "users", doctorId), {
        verified: false,
        rejectedAt: new Date().toISOString(),
      })
      toast({
        title: "Success",
        description: "Doctor rejected",
      })
    } catch (error) {
      console.error("Error rejecting doctor:", error)
      toast({
        title: "Error",
        description: "Failed to reject doctor",
        variant: "destructive",
      })
    } finally {
      setProcessing(null)
    }
  }

  const handleCreateUser = async () => {
    try {
      const auth = getFirebaseAuth()
      const db = getFirebaseFirestore()

      if (!newUserForm.email || !newUserForm.password || !newUserForm.fullName) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, newUserForm.email, newUserForm.password)

      // Create user document in Firestore
      await addDoc(collection(db, "users"), {
        email: newUserForm.email,
        userType: newUserForm.userType,
        fullName: newUserForm.fullName,
        phoneNumber: newUserForm.phoneNumber,
        createdAt: new Date().toISOString(),
        profileCompleted: false,
        verified: newUserForm.userType === "doctor" ? false : true,
      })

      toast({
        title: "Success",
        description: "User created successfully",
      })

      setNewUserDialog(false)
      setNewUserForm({
        email: "",
        password: "",
        userType: "patient",
        fullName: "",
        phoneNumber: "",
      })
    } catch (error: any) {
      console.error("Error creating user:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      })
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      (user.fullName && user.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.pharmacyName && user.pharmacyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === "all" || user.userType === filterType
    return matchesSearch && matchesFilter
  })

  const pendingDoctors = users.filter((user) => user.userType === "doctor" && user.verified !== true)
  const approvedDoctors = users.filter((user) => user.userType === "doctor" && user.verified === true)

  const getUserIcon = (userType: string) => {
    switch (userType) {
      case "patient":
        return <Users className="h-4 w-4" />
      case "doctor":
        return <Stethoscope className="h-4 w-4" />
      case "pharmacy":
        return <Building className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users, approve doctors, and view analytics</p>
        </div>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          Administrator
        </Badge>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.totalPatients} patients, {analytics.totalDoctors} doctors, {analytics.totalPharmacies}{" "}
              pharmacies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doctor Status</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.approvedDoctors}</div>
            <p className="text-xs text-muted-foreground">{analytics.pendingDoctors} pending approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalOrders}</div>
            <p className="text-xs text-muted-foreground">Medicine orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalAppointments}</div>
            <p className="text-xs text-muted-foreground">Doctor appointments</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="doctors">
            Doctor Approvals
            {pendingDoctors.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingDoctors.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* User Management Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage all registered users</CardDescription>
                </div>
                <Dialog open={newUserDialog} onOpenChange={setNewUserDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New User</DialogTitle>
                      <DialogDescription>Add a new user to the platform</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newUserForm.email}
                          onChange={(e) => setNewUserForm((prev) => ({ ...prev, email: e.target.value }))}
                          placeholder="user@example.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="password">Password *</Label>
                        <Input
                          id="password"
                          type="password"
                          value={newUserForm.password}
                          onChange={(e) => setNewUserForm((prev) => ({ ...prev, password: e.target.value }))}
                          placeholder="Minimum 6 characters"
                        />
                      </div>
                      <div>
                        <Label htmlFor="fullName">Full Name *</Label>
                        <Input
                          id="fullName"
                          value={newUserForm.fullName}
                          onChange={(e) => setNewUserForm((prev) => ({ ...prev, fullName: e.target.value }))}
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        <Input
                          id="phoneNumber"
                          value={newUserForm.phoneNumber}
                          onChange={(e) => setNewUserForm((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                          placeholder="+1234567890"
                        />
                      </div>
                      <div>
                        <Label htmlFor="userType">User Type *</Label>
                        <Select
                          value={newUserForm.userType}
                          onValueChange={(value: "patient" | "doctor" | "pharmacy") =>
                            setNewUserForm((prev) => ({ ...prev, userType: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="patient">Patient</SelectItem>
                            <SelectItem value="doctor">Doctor</SelectItem>
                            <SelectItem value="pharmacy">Pharmacy</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleCreateUser} className="w-full">
                        Create User
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search and Filter */}
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="patient">Patients</SelectItem>
                    <SelectItem value="doctor">Doctors</SelectItem>
                    <SelectItem value="pharmacy">Pharmacies</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Users List */}
              <div className="space-y-2">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No users found matching your criteria</div>
                ) : (
                  filteredUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        {getUserIcon(user.userType)}
                        <div>
                          <p className="font-medium">{user.fullName || user.pharmacyName || "No name"}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <Badge className={getUserTypeColor(user.userType)}>{user.userType}</Badge>
                        {user.userType === "doctor" && (
                          <Badge variant={user.verified ? "default" : "secondary"}>
                            {user.verified ? "Approved" : "Pending"}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this user? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Doctor Approvals Tab */}
        <TabsContent value="doctors" className="space-y-4">
          {/* Pending Doctors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Pending Doctor Approvals ({pendingDoctors.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingDoctors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No pending doctor approvals</div>
              ) : (
                <div className="space-y-4">
                  {pendingDoctors.map((doctor) => (
                    <div key={doctor.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <h3 className="font-semibold">{doctor.fullName || doctor.email}</h3>
                          <p className="text-sm text-muted-foreground">{doctor.email}</p>
                          {doctor.specialization && (
                            <p className="text-sm">
                              <strong>Specialization:</strong> {doctor.specialization}
                            </p>
                          )}
                          {doctor.licenseNumber && (
                            <p className="text-sm">
                              <strong>License:</strong> {doctor.licenseNumber}
                            </p>
                          )}
                          {doctor.experience && (
                            <p className="text-sm">
                              <strong>Experience:</strong> {doctor.experience} years
                            </p>
                          )}
                          <Badge variant="secondary">Pending Approval</Badge>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" onClick={() => setSelectedDoctor(doctor)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleApproveDoctor(doctor.id)}
                            disabled={processing === doctor.id}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {processing === doctor.id ? "Processing..." : "Approve"}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRejectDoctor(doctor.id)}
                            disabled={processing === doctor.id}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Approved Doctors */}
          <Card>
            <CardHeader>
              <CardTitle>Approved Doctors ({approvedDoctors.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {approvedDoctors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No approved doctors yet</div>
              ) : (
                <div className="space-y-2">
                  {approvedDoctors.map((doctor) => (
                    <div key={doctor.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Stethoscope className="h-4 w-4" />
                        <div>
                          <p className="font-medium">{doctor.fullName || doctor.email}</p>
                          <p className="text-sm text-muted-foreground">{doctor.email}</p>
                          {doctor.specialization && (
                            <p className="text-xs text-muted-foreground">{doctor.specialization}</p>
                          )}
                        </div>
                        <Badge variant="default">Approved</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Patients</span>
                  <Badge variant="secondary">{analytics.totalPatients}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Doctors</span>
                  <Badge variant="secondary">{analytics.totalDoctors}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Pharmacies</span>
                  <Badge variant="secondary">{analytics.totalPharmacies}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Platform Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Medicine Orders</span>
                  <Badge variant="outline">{analytics.totalOrders}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Appointments</span>
                  <Badge variant="outline">{analytics.totalAppointments}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Approved Doctors</span>
                  <Badge variant="outline">{analytics.approvedDoctors}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Pending Approvals</span>
                  <Badge variant="outline">{analytics.pendingDoctors}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Doctor Details Modal */}
      {selectedDoctor && (
        <Dialog open={!!selectedDoctor} onOpenChange={() => setSelectedDoctor(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Doctor Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Full Name</Label>
                  <p className="text-sm text-muted-foreground">{selectedDoctor.fullName || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm text-muted-foreground">{selectedDoctor.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Specialization</Label>
                  <p className="text-sm text-muted-foreground">{selectedDoctor.specialization || "Not specified"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">License Number</Label>
                  <p className="text-sm text-muted-foreground">{selectedDoctor.licenseNumber || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Experience</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedDoctor.experience ? `${selectedDoctor.experience} years` : "Not specified"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Applied Date</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedDoctor.createdAt
                      ? new Date(
                          selectedDoctor.createdAt.seconds
                            ? selectedDoctor.createdAt.seconds * 1000
                            : selectedDoctor.createdAt,
                        ).toLocaleDateString()
                      : "Unknown"}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => {
                    handleApproveDoctor(selectedDoctor.id)
                    setSelectedDoctor(null)
                  }}
                  disabled={processing === selectedDoctor.id}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleRejectDoctor(selectedDoctor.id)
                    setSelectedDoctor(null)
                  }}
                  disabled={processing === selectedDoctor.id}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button variant="outline" onClick={() => setSelectedDoctor(null)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
