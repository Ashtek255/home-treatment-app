"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { collection, query, where, onSnapshot, updateDoc, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { Search, MapPin, Clock, User, Phone, Package, Truck, CheckCircle, Bell } from "lucide-react"

interface OrderItem {
  medicineId: string
  medicineName: string
  quantity: number
  price: number
}

interface Order {
  id: string
  patientId: string
  patientName: string
  patientPhone: string
  patientEmail: string
  address: string
  items: OrderItem[]
  total: number
  status: "pending" | "preparing" | "out-for-delivery" | "delivered" | "cancelled"
  orderTime: any
  pharmacyId: string
  distance?: string
  notes?: string
}

export function OrdersContent() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [newOrdersCount, setNewOrdersCount] = useState(0)

  useEffect(() => {
    if (!user) return

    // Set up real-time orders listener
    const ordersQuery = query(collection(db, "orders"), where("pharmacyId", "==", user.uid))

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const ordersList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[]

      // Sort orders by creation time (newest first)
      ordersList.sort((a, b) => {
        const timeA = a.orderTime?.seconds || 0
        const timeB = b.orderTime?.seconds || 0
        return timeB - timeA
      })

      setOrders(ordersList)

      // Count new orders (pending status)
      const newOrders = ordersList.filter((order) => order.status === "pending")
      setNewOrdersCount(newOrders.length)

      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  // Filter orders based on search and tab
  const filterOrders = (status: string) => {
    return orders.filter(
      (order) =>
        (order.status === status || status === "all") &&
        ((order.patientName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (order.id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (order.patientPhone || "").includes(searchQuery)),
    )
  }

  const newOrders = filterOrders("pending")
  const preparingOrders = filterOrders("preparing")
  const outForDeliveryOrders = filterOrders("out-for-delivery")
  const deliveredOrders = filterOrders("delivered")

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">New</Badge>
      case "preparing":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Preparing</Badge>
      case "out-for-delivery":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Out for Delivery</Badge>
      case "delivered":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Delivered</Badge>
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order)
    setShowDetailsDialog(true)
  }

  // Update inventory stock when order is delivered
  const updateInventoryStock = async (order: Order) => {
    if (!order.items || order.items.length === 0) return

    try {
      // Process each item in the order
      for (const item of order.items) {
        let updated = false
        const collections = ["medicines", "inventory", "pharmacyInventory"]

        // Try to find and update the medicine in different collections
        for (const collectionName of collections) {
          if (updated) break

          try {
            const medicineRef = doc(db, collectionName, item.medicineId)
            const medicineSnap = await getDoc(medicineRef)

            if (medicineSnap.exists()) {
              const medicineData = medicineSnap.data()

              // Check for different possible stock field names
              const currentStock = medicineData.stock || medicineData.quantity || medicineData.amount || 0
              const newStock = Math.max(0, currentStock - item.quantity)

              // Update the medicine stock
              await updateDoc(medicineRef, {
                stock: newStock,
                quantity: newStock, // Update both fields to be safe
                updatedAt: new Date(),
              })

              console.log(`Updated stock for ${item.medicineName} in ${collectionName}: ${currentStock} -> ${newStock}`)

              // Check if stock is now below minimum
              const minStock = medicineData.minStock || medicineData.minimumStock || 10
              if (newStock <= minStock) {
                toast({
                  title: "Low Stock Alert",
                  description: `${item.medicineName} is now low in stock (${newStock} remaining)`,
                  variant: "destructive",
                })
              }

              updated = true
            }
          } catch (collectionError) {
            console.log(`Could not update in ${collectionName}:`, collectionError)
          }
        }

        if (!updated) {
          console.warn(`Medicine ${item.medicineId} (${item.medicineName}) not found in any inventory collection`)
          toast({
            title: "Inventory Warning",
            description: `Could not update stock for ${item.medicineName}. Please check manually.`,
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Error updating inventory:", error)
      toast({
        title: "Inventory Update Failed",
        description: "Failed to update inventory stock. Please check manually.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateStatus = async (order: Order, newStatus: string) => {
    setIsUpdating(true)
    try {
      // If the new status is "delivered", update inventory
      if (newStatus === "delivered") {
        await updateInventoryStock(order)
      }

      // Update the order status
      await updateDoc(doc(db, "orders", order.id), {
        status: newStatus,
        updatedAt: new Date(),
      })

      toast({
        title: "Success",
        description: `Order status updated to ${newStatus.replace("-", " ")}`,
      })

      // Close dialog if open
      if (showDetailsDialog) {
        setShowDetailsDialog(false)
        setSelectedOrder(null)
      }
    } catch (error) {
      console.error("Error updating order status:", error)
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const getNextStatusButton = (order: Order) => {
    switch (order.status) {
      case "pending":
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleUpdateStatus(order, "cancelled")}
              disabled={isUpdating}
            >
              {isUpdating ? "Processing..." : "Decline"}
            </Button>
            <Button size="sm" onClick={() => handleUpdateStatus(order, "preparing")} disabled={isUpdating}>
              <Package className="h-4 w-4 mr-2" />
              {isUpdating ? "Processing..." : "Accept"}
            </Button>
          </div>
        )
      case "preparing":
        return (
          <Button size="sm" onClick={() => handleUpdateStatus(order, "out-for-delivery")} disabled={isUpdating}>
            <Truck className="h-4 w-4 mr-2" />
            {isUpdating ? "Processing..." : "Send for Delivery"}
          </Button>
        )
      case "out-for-delivery":
        return (
          <Button size="sm" onClick={() => handleUpdateStatus(order, "delivered")} disabled={isUpdating}>
            <CheckCircle className="h-4 w-4 mr-2" />
            {isUpdating ? "Processing..." : "Mark as Delivered"}
          </Button>
        )
      default:
        return null
    }
  }

  const formatOrderTime = (orderTime: any) => {
    if (!orderTime) return "Just now"

    if (orderTime.toDate) {
      return orderTime.toDate().toLocaleString()
    }

    if (orderTime.seconds) {
      return new Date(orderTime.seconds * 1000).toLocaleString()
    }

    return "Just now"
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Order Management</h1>
        {newOrdersCount > 0 && (
          <Badge variant="destructive" className="flex items-center gap-1">
            <Bell className="h-3 w-3" />
            {newOrdersCount} New Order{newOrdersCount > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          placeholder="Search by order ID, customer name, or phone number..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">
            New{" "}
            {newOrders.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {newOrders.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="preparing">
            Preparing{" "}
            {preparingOrders.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {preparingOrders.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="out-for-delivery">
            Out for Delivery{" "}
            {outForDeliveryOrders.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {outForDeliveryOrders.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="delivered">Delivered</TabsTrigger>
        </TabsList>

        {["pending", "preparing", "out-for-delivery", "delivered"].map((status) => (
          <TabsContent key={status} value={status} className="space-y-4 mt-4">
            {filterOrders(status).length > 0 ? (
              filterOrders(status).map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{order.id}</h3>
                            {getStatusBadge(order.status)}
                          </div>
                          <div className="text-sm text-gray-500 md:hidden">{formatOrderTime(order.orderTime)}</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{order.patientName}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Phone className="h-4 w-4" />
                          <span>{order.patientPhone}</span>
                        </div>

                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <MapPin className="h-4 w-4" />
                          <span>{order.distance || "Distance not calculated"}</span>
                        </div>

                        <div className="flex items-center gap-1 text-sm text-gray-500 hidden md:flex">
                          <Clock className="h-4 w-4" />
                          <span>{formatOrderTime(order.orderTime)}</span>
                        </div>

                        <p className="font-medium mt-2">
                          Total: ${(order.total || 0).toFixed(2)} •{" "}
                          {(order.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0)} items
                        </p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button variant="outline" onClick={() => handleViewDetails(order)}>
                          View Details
                        </Button>
                        {getNextStatusButton(order)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No {status.replace("-", " ")} orders</h3>
                  <p className="text-gray-500">
                    {status === "pending"
                      ? "New orders will appear here when patients place them."
                      : `Orders with ${status.replace("-", " ")} status will appear here.`}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Order Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>Order {selectedOrder?.id}</DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{selectedOrder.id}</h3>
                  <p className="text-sm text-gray-500">{formatOrderTime(selectedOrder.orderTime)}</p>
                </div>
                {getStatusBadge(selectedOrder.status)}
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Customer Information</h4>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span>{selectedOrder.patientName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{selectedOrder.patientPhone}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                    <span>{selectedOrder.address}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Order Items</h4>
                <div className="border rounded-md divide-y">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between p-2">
                      <div>
                        <span className="font-medium">{item.medicineName}</span>
                        <span className="text-gray-500 ml-2">x{item.quantity}</span>
                      </div>
                      <span>${((item.price || 0) * (item.quantity || 0)).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between p-2 font-medium">
                    <span>Total</span>
                    <span>${(selectedOrder.total || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="space-y-2">
                  <h4 className="font-medium">Notes</h4>
                  <p className="text-sm text-gray-600 p-2 bg-gray-50 rounded">{selectedOrder.notes}</p>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="font-medium">Update Status</h4>
                <Select
                  defaultValue={selectedOrder.status}
                  onValueChange={(value) => handleUpdateStatus(selectedOrder, value)}
                  disabled={isUpdating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">New</SelectItem>
                    <SelectItem value="preparing">Preparing</SelectItem>
                    <SelectItem value="out-for-delivery">Out for Delivery</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                {isUpdating && (
                  <div className="flex items-center justify-center py-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                    <span className="text-sm">Updating...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)} disabled={isUpdating}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
