"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency, downloadFile } from "@/lib/utils"
import { Building, Users, Plus, Edit, Download, FileText, Search, Filter } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

interface Room {
  id: string
  number: string
  type: string
  roomTypeId?: string
  status: string
  price: number
  features: string
  maxGuests: number
  currentGuest: string | null
  checkOut: string | null
}

interface Guest {
  id: string
  name: string
  room: string
  room_id: string
  roomType: string
  checkIn: string
  checkOut: string
  status: string
  checkin_status: string
  guests: number
  phone: string
  email: string
  balance: number
}

const mockReports = [
  { id: "occupancy", name: "Occupancy Report", description: "Daily occupancy rates and trends" },
  { id: "revenue", name: "Revenue Report", description: "Financial performance and revenue analysis" },
  { id: "guest", name: "Guest Report", description: "Guest demographics and satisfaction" },
  { id: "maintenance", name: "Maintenance Report", description: "Room maintenance and service requests" },
]

const formatDateTime = (date: string) => {
  return new Date(date).toLocaleDateString()
}

export default function ManagerDashboard() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [guests, setGuests] = useState<Guest[]>([])
  const [roomTypes, setRoomTypes] = useState<Array<{
    id: string;
    type_name: string;
    base_price: number;
    capacity: number;
  }>>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const { toast } = useToast()
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Redirect unauthorized users
    if (!loading && (!user || (user.role !== "manager" && user.role !== "admin"))) {
      router.replace("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && (user.role === "manager" || user.role === "admin")) {
      const fetchData = async () => {
        try {
          const [roomsResponse, guestsResponse, roomTypesResponse] = await Promise.all([
            fetch('/api/manager/rooms'),
            fetch('/api/manager/guests'),
            fetch('/api/room-types')
          ])

          if (roomsResponse.ok) {
            const roomsData = await roomsResponse.json()
            setRooms(roomsData.rooms || [])
          }

          if (guestsResponse.ok) {
            const guestsData = await guestsResponse.json()
            setGuests(guestsData.guests || [])
          }

          if (roomTypesResponse.ok) {
            const roomTypesData = await roomTypesResponse.json()
            setRoomTypes(roomTypesData.roomTypes || [])
          }
        } catch (error) {
          console.error('Error fetching data:', error)
        }
      }
      fetchData()
    }
  }, [user, toast])

  // Defensive .includes fix for undefined/null fields
  const filteredRooms = rooms.filter((room) => {
    const matchesSearch =
      (room.number ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (room.type ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (room.currentGuest ?? "").toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === "all" || room.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)

    const roomData = {
      number: formData.get("number") as string,
      roomTypeId: formData.get("roomTypeId") as string,
    }

    try {
      const response = await fetch('/api/manager/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roomData),
      });
      
      if (response.ok) {
        toast({
          title: "Room Added",
          description: `Room ${roomData.number} has been added successfully.`,
        })
        // Refresh rooms
        const roomsResponse = await fetch('/api/manager/rooms', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (roomsResponse.ok) {
          const roomsData = await roomsResponse.json();
          setRooms(roomsData.rooms || []);
        }
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to add room.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add room.",
        variant: "destructive",
      })
    }
    setIsRoomDialogOpen(false)
  }

  const handleEditRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)

    if (!editingRoom) return

    const updatedData = {
      number: formData.get("number") as string,
      roomTypeId: formData.get("roomTypeId") as string,
    }

    try {
      const response = await fetch(`/api/manager/rooms/${editingRoom.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });
      
      if (response.ok) {
        toast({
          title: "Room Updated",
          description: `Room ${updatedData.number} has been updated successfully.`,
        })
        // Refresh rooms
        const roomsResponse = await fetch('/api/manager/rooms', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (roomsResponse.ok) {
          const roomsData = await roomsResponse.json();
          setRooms(roomsData.rooms || []);
        }
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to update room.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update room.",
        variant: "destructive",
      })
    }
    setEditingRoom(null)
  }

  const handleDeleteRoom = async (roomId: string, roomNumber: string) => {
    if (!confirm(`Are you sure you want to delete Room ${roomNumber}? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/manager/rooms/${roomId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        toast({
          title: "Room Deleted",
          description: `Room ${roomNumber} has been deleted successfully.`,
        })
        // Refresh rooms
        const roomsResponse = await fetch('/api/manager/rooms', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (roomsResponse.ok) {
          const roomsData = await roomsResponse.json();
          setRooms(roomsData.rooms || []);
        }
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to delete room.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete room.",
        variant: "destructive",
      })
    }
  }

  const generateReportContent = (reportId: string) => {
    const report = mockReports.find((r) => r.id === reportId)
    if (!report) return ""

    let content = `
HOTEL LUXURY - ${report.name.toUpperCase()}
Generated: ${new Date().toLocaleString()}
========================================
`
    if (reportId === "occupancy") {
      const occupiedRooms = rooms.filter((r) => r.status === "occupied").length
      const availableRooms = rooms.filter((r) => r.status === "available").length
      const maintenanceRooms = rooms.filter((r) => r.status === "maintenance").length
      const totalRooms = rooms.length
      const occupancyRate = totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(2) : "0.00"

      content += `
OCCUPANCY SUMMARY:
Total Rooms: ${totalRooms}
Occupied Rooms: ${occupiedRooms}
Available Rooms: ${availableRooms}
Maintenance Rooms: ${maintenanceRooms}
Occupancy Rate: ${occupancyRate}%

ROOM BREAKDOWN BY TYPE:
${Object.entries(rooms.reduce((acc, room) => {
  const type = room.type
  if (!acc[type]) acc[type] = { total: 0, occupied: 0 }
  acc[type].total++
  if (room.status === "occupied") acc[type].occupied++
  return acc
}, {} as Record<string, { total: number; occupied: number }>))
  .map(([type, stats]) => `${type}: ${stats.occupied}/${stats.total} (${((stats.occupied / stats.total) * 100).toFixed(1)}%)`)
  .join("\n")}
`
    } else if (reportId === "revenue") {
      const totalRevenue = guests.reduce((sum, guest) => sum + guest.balance, 0)
      const averageRevenue = guests.length > 0 ? totalRevenue / guests.length : 0

      content += `
REVENUE SUMMARY:
Total Revenue: ${formatCurrency(totalRevenue)}
Average Revenue per Guest: ${formatCurrency(averageRevenue)}
Total Guests: ${guests.length}

REVENUE BY ROOM TYPE:
${Object.entries(rooms.reduce((acc, room) => {
  const type = room.type
  if (!acc[type]) acc[type] = 0
  acc[type] += room.price
  return acc
}, {} as Record<string, number>))
  .map(([type, revenue]) => `${type}: ${formatCurrency(revenue)}`)
  .join("\n")}
`
    } else if (reportId === "guest") {
      const checkedInGuests = guests.filter((g) => g.checkin_status === "checked_in").length
      const checkedOutGuests = guests.filter((g) => g.checkin_status === "checked_out").length
      const pendingGuests = guests.filter((g) => g.status === "pending").length

      content += `
GUEST SUMMARY:
Total Guests: ${guests.length}
Checked In: ${checkedInGuests}
Checked Out: ${checkedOutGuests}
Pending: ${pendingGuests}

GUEST LIST:
${guests.map((guest) => `
- ${guest.name} (${guest.room})
  Status: ${guest.status}
  Balance: ${formatCurrency(guest.balance)}
  Check-in: ${formatDateTime(guest.checkIn)}
  Check-out: ${formatDateTime(guest.checkOut)}
`).join("")}
`
    } else if (reportId === "maintenance") {
      const maintenanceRooms = rooms.filter((r) => r.status === "maintenance")

      content += `
MAINTENANCE SUMMARY:
Rooms Under Maintenance: ${maintenanceRooms.length}

MAINTENANCE ROOMS:
${maintenanceRooms.map((room) => `
- Room ${room.number} (${room.type})
  Features: ${room.features}
  Max Guests: ${room.maxGuests}
`).join("")}
`
    }

    return content
  }

  const handleDownloadReport = (reportId: string) => {
    const content = generateReportContent(reportId)
    const report = mockReports.find((r) => r.id === reportId)
    const filename = `${report?.name.toLowerCase().replace(" ", "-")}-${new Date().toISOString().split("T")[0]}.txt`
    downloadFile(content, filename)
    toast({
      title: "Report Downloaded",
      description: `${report?.name} has been downloaded successfully.`,
    })
  }

  const handlePrintReport = (reportId: string) => {
    const content = generateReportContent(reportId)
    const report = mockReports.find((r) => r.id === reportId)
    const filename = `${report?.name.toLowerCase().replace(" ", "-")}-${new Date().toISOString().split("T")[0]}.txt`
    downloadFile(content, filename)
    toast({
      title: "Report Generated",
      description: `${report?.name} has been generated for printing.`,
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800"
      case "occupied":
        return "bg-blue-100 text-blue-800"
      case "maintenance":
        return "bg-red-100 text-red-800"
      case "reserved":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-lg">Loading manager dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user || (user.role !== "manager" && user.role !== "admin")) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6 max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="text-gray-900">Unauthorized</CardTitle>
            <CardDescription className="text-gray-600">
              You do not have permission to view this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manager Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage rooms, guests, and generate reports</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Building className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Rooms</p>
                  <p className="text-2xl font-bold text-gray-900">{rooms.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Guests</p>
                  <p className="text-2xl font-bold text-gray-900">{guests.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Building className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Available Rooms</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {rooms.filter(r => r.status === "available").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Building className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Occupied Rooms</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {rooms.filter(r => r.status === "occupied").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reports Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {mockReports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{report.name}</CardTitle>
                  <CardDescription>{report.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadReport(report.id)}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrintReport(report.id)}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Room Management */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Room Management</h2>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search rooms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setIsRoomDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Room
              </Button>
            </div>
          </div>

          {filteredRooms.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || filterStatus !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "No rooms are currently registered"}
                </p>
                {!searchTerm && filterStatus === "all" && (
                  <Button onClick={() => setIsRoomDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Room
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {filteredRooms.map((room) => (
                <Card key={room.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Room {room.number}</h3>
                        <p className="text-gray-600">{room.type}</p>
                        <p className="text-sm text-gray-500">
                          Max Guests: {room.maxGuests} • Features: {room.features || "None"}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(room.status)}>
                          {room.status}
                        </Badge>
                        <p className="text-lg font-bold text-gray-900 mt-2">
                          {formatCurrency(room.price)}/night
                        </p>
                      </div>
                    </div>

                    {room.currentGuest && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Current Guest:</strong> {room.currentGuest}
                        </p>
                        {room.checkOut && (
                          <p className="text-sm text-blue-600">
                            Check-out: {formatDateTime(room.checkOut)}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingRoom(room)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteRoom(room.id, room.number)}
                        disabled={room.status === "occupied"}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Room Dialog */}
      <Dialog open={isRoomDialogOpen || !!editingRoom} onOpenChange={(open) => {
        if (!open) {
          setIsRoomDialogOpen(false)
          setEditingRoom(null)
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRoom ? "Edit Room" : "Add New Room"}</DialogTitle>
            <DialogDescription>
              {editingRoom ? "Update room information" : "Add a new room to the hotel"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editingRoom ? handleEditRoom : handleAddRoom} className="space-y-4">
            <div>
              <Label htmlFor="number">Room Number</Label>
              <Input
                id="number"
                name="number"
                defaultValue={editingRoom?.number}
                required
              />
            </div>
            <div>
              <Label htmlFor="roomTypeId">Room Type</Label>
              <Select name="roomTypeId" defaultValue={editingRoom?.roomTypeId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select room type" />
                </SelectTrigger>
                <SelectContent>
                  {roomTypes.map((roomType) => (
                    <SelectItem key={roomType.id} value={roomType.id}>
                      {roomType.type_name} - {formatCurrency(roomType.base_price)}/night
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                {editingRoom ? "Update Room" : "Add Room"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsRoomDialogOpen(false)
                  setEditingRoom(null)
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}