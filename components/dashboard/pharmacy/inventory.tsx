"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { Search, Plus, Edit, Trash2, AlertTriangle, Package } from "lucide-react"

interface Medicine {
  id: string
  name: string
  description: string
  price: number
  stock: number
  category: string
  prescription: boolean
  minStock: number
  expiryDate: string
  pharmacyId: string
  createdAt: any
}

const categories = [
  "Pain Relief",
  "Antibiotics",
  "Allergy",
  "Digestive Health",
  "Diabetes",
  "Heart & Blood Pressure",
  "Respiratory",
  "Vitamins & Supplements",
  "First Aid",
  "Other",
]

export function InventoryContent() {
  const { user } = useAuth()
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Form data for add/edit
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    prescription: false,
    minStock: "",
    expiryDate: "",
  })

  useEffect(() => {
    if (!user) return

    // Set up real-time medicines listener
    const medicinesQuery = query(collection(db, "medicines"), where("pharmacyId", "==", user.uid))

    const unsubscribe = onSnapshot(medicinesQuery, (snapshot) => {
      const medicinesList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Medicine[]

      // Sort by name
      medicinesList.sort((a, b) => a.name.localeCompare(b.name))

      setMedicines(medicinesList)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  // Filter medicines based on search and category
  const filteredMedicines = medicines.filter((medicine) => {
    const matchesSearch =
      medicine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      medicine.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      medicine.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = selectedCategory === "all" || medicine.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  // Get low stock medicines
  const lowStockMedicines = medicines.filter((medicine) => medicine.stock <= medicine.minStock)

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      stock: "",
      category: "",
      prescription: false,
      minStock: "",
      expiryDate: "",
    })
  }

  const handleEdit = (medicine: Medicine) => {
    setSelectedMedicine(medicine)
    setFormData({
      name: medicine.name,
      description: medicine.description,
      price: medicine.price.toString(),
      stock: medicine.stock.toString(),
      category: medicine.category,
      prescription: medicine.prescription,
      minStock: medicine.minStock.toString(),
      expiryDate: medicine.expiryDate,
    })
    setShowEditDialog(true)
  }

  const handleAddMedicine = async () => {
    if (!user || !formData.name || !formData.price || !formData.stock) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      await addDoc(collection(db, "medicines"), {
        ...formData,
        price: Number.parseFloat(formData.price),
        stock: Number.parseInt(formData.stock),
        minStock: Number.parseInt(formData.minStock) || 10,
        pharmacyId: user.uid,
        createdAt: new Date(),
      })

      toast({
        title: "Success",
        description: "Medicine added successfully",
      })

      setShowAddDialog(false)
      resetForm()
    } catch (error) {
      console.error("Error adding medicine:", error)
      toast({
        title: "Error",
        description: "Failed to add medicine",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateMedicine = async () => {
    if (!selectedMedicine || !formData.name || !formData.price || !formData.stock) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      await updateDoc(doc(db, "medicines", selectedMedicine.id), {
        ...formData,
        price: Number.parseFloat(formData.price),
        stock: Number.parseInt(formData.stock),
        minStock: Number.parseInt(formData.minStock) || 10,
      })

      toast({
        title: "Success",
        description: "Medicine updated successfully",
      })

      setShowEditDialog(false)
      setSelectedMedicine(null)
      resetForm()
    } catch (error) {
      console.error("Error updating medicine:", error)
      toast({
        title: "Error",
        description: "Failed to update medicine",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteMedicine = async (medicineId: string) => {
    if (!confirm("Are you sure you want to delete this medicine?")) return

    try {
      await deleteDoc(doc(db, "medicines", medicineId))
      toast({
        title: "Success",
        description: "Medicine deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting medicine:", error)
      toast({
        title: "Error",
        description: "Failed to delete medicine",
        variant: "destructive",
      })
    }
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
        <h1 className="text-2xl font-bold">Inventory Management</h1>
        <Button
          onClick={() => {
            resetForm()
            setShowAddDialog(true)
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Medicine
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">All Medicines</TabsTrigger>
          <TabsTrigger value="low-stock">
            Low Stock{" "}
            {lowStockMedicines.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {lowStockMedicines.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search medicines by name, category, or description..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <TabsContent value="all" className="space-y-4">
            {filteredMedicines.length > 0 ? (
              <div className="rounded-md border">
                <div className="grid grid-cols-12 gap-4 p-4 font-medium border-b bg-muted">
                  <div className="col-span-3">Name</div>
                  <div className="col-span-2">Category</div>
                  <div className="col-span-2">Price</div>
                  <div className="col-span-2">Stock</div>
                  <div className="col-span-1">Rx</div>
                  <div className="col-span-2">Actions</div>
                </div>

                {filteredMedicines.map((medicine) => (
                  <div key={medicine.id} className="grid grid-cols-12 gap-4 p-4 border-b items-center">
                    <div className="col-span-3">
                      <div className="font-medium">{medicine.name}</div>
                      <div className="text-sm text-gray-500 truncate">{medicine.description}</div>
                    </div>
                    <div className="col-span-2">{medicine.category}</div>
                    <div className="col-span-2">${medicine.price?.toFixed(2) || "0.00"}</div>
                    <div className="col-span-2">
                      <span className={`${medicine.stock <= medicine.minStock ? "text-red-600 font-medium" : ""}`}>
                        {medicine.stock || 0}
                      </span>
                      {medicine.stock <= medicine.minStock && (
                        <AlertTriangle className="h-4 w-4 text-red-600 inline ml-1" />
                      )}
                    </div>
                    <div className="col-span-1">
                      {medicine.prescription ? (
                        <Badge variant="outline">Yes</Badge>
                      ) : (
                        <span className="text-gray-500">No</span>
                      )}
                    </div>
                    <div className="col-span-2 flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(medicine)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-600"
                        onClick={() => handleDeleteMedicine(medicine.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    {searchQuery || selectedCategory !== "all" ? "No medicines found" : "No medicines in inventory"}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {searchQuery || selectedCategory !== "all"
                      ? "Try adjusting your search or filter criteria."
                      : "Start by adding medicines to your inventory."}
                  </p>
                  {!searchQuery && selectedCategory === "all" && (
                    <Button
                      onClick={() => {
                        resetForm()
                        setShowAddDialog(true)
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Medicine
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="low-stock" className="space-y-4">
            {lowStockMedicines.length > 0 ? (
              <div className="rounded-md border">
                <div className="grid grid-cols-12 gap-4 p-4 font-medium border-b bg-muted">
                  <div className="col-span-3">Name</div>
                  <div className="col-span-2">Category</div>
                  <div className="col-span-2">Current Stock</div>
                  <div className="col-span-2">Min Stock</div>
                  <div className="col-span-3">Actions</div>
                </div>

                {lowStockMedicines.map((medicine) => (
                  <div key={medicine.id} className="grid grid-cols-12 gap-4 p-4 border-b items-center">
                    <div className="col-span-3">
                      <div className="font-medium">{medicine.name}</div>
                      <div className="text-sm text-gray-500 truncate">{medicine.description}</div>
                    </div>
                    <div className="col-span-2">{medicine.category}</div>
                    <div className="col-span-2 text-red-600 font-medium flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      {medicine.stock || 0}
                    </div>
                    <div className="col-span-2">{medicine.minStock || 0}</div>
                    <div className="col-span-3 flex gap-2">
                      <Button size="sm" onClick={() => handleEdit(medicine)}>
                        Restock
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(medicine)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <Package className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">All Stock Levels Good</h3>
                  <p className="text-gray-500">No medicines are currently low in stock.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </div>
      </Tabs>

      {/* Add Medicine Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Medicine</DialogTitle>
            <DialogDescription>Enter the details of the new medicine to add to your inventory.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Medicine Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter medicine name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter medicine description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price ($) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Initial Stock *</Label>
                <Input
                  id="stock"
                  type="number"
                  placeholder="0"
                  value={formData.stock}
                  onChange={(e) => setFormData((prev) => ({ ...prev, stock: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min-stock">Minimum Stock</Label>
                <Input
                  id="min-stock"
                  type="number"
                  placeholder="10"
                  value={formData.minStock}
                  onChange={(e) => setFormData((prev) => ({ ...prev, minStock: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input
                  id="expiry"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, expiryDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="prescription"
                className="rounded border-gray-300"
                checked={formData.prescription}
                onChange={(e) => setFormData((prev) => ({ ...prev, prescription: e.target.checked }))}
              />
              <Label htmlFor="prescription">Requires Prescription</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMedicine} disabled={isSaving}>
              {isSaving ? "Adding..." : "Add Medicine"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Medicine Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Medicine</DialogTitle>
            <DialogDescription>Update the details of {selectedMedicine?.name}.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Medicine Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-price">Price ($) *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-stock">Current Stock *</Label>
                <Input
                  id="edit-stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData((prev) => ({ ...prev, stock: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-min-stock">Minimum Stock</Label>
                <Input
                  id="edit-min-stock"
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => setFormData((prev) => ({ ...prev, minStock: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-expiry">Expiry Date</Label>
                <Input
                  id="edit-expiry"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, expiryDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-prescription"
                className="rounded border-gray-300"
                checked={formData.prescription}
                onChange={(e) => setFormData((prev) => ({ ...prev, prescription: e.target.checked }))}
              />
              <Label htmlFor="edit-prescription">Requires Prescription</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateMedicine} disabled={isSaving}>
              {isSaving ? "Updating..." : "Update Medicine"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
