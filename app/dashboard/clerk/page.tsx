"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import {
  Users,
  UserCheck,
  UserX,
  Plus,
  Search,
  CreditCard,
  Clock,
  Phone,
  FileText,
  Filter,
  Download,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency, formatDateTime, downloadFile } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

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
  is_travel_company: boolean
  display_name: string
}

export default function ClerkDashboard() {
  const { user, loading } = useAuth()
  const { toast } = useToast()
  const [guests, setGuests] = useState<Guest[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isWalkInOpen, setIsWalkInOpen] = useState(false)
  const [isChargesOpen, setIsChargesOpen] = useState(false)
  const [isCheckInOpen, setIsCheckInOpen] = useState(false)
  const [selectedGuest, setSelectedGuest] = useState<string | null>(null)
  const [selectedGuestForCheckIn, setSelectedGuestForCheckIn] = useState<Guest | null>(null)
  const [availableRooms, setAvailableRooms] = useState<{id: string, number: string, type: string, price: number, capacity: number}[]>([])
  const [loadingActions, setLoadingActions] = useState<{[key: string]: boolean}>({})

  const fetchGuests = async () => {
    try {
      // Fetch guests using the new API
      const response = await fetch('/api/clerk/guests', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setGuests(data.guests || []);
      } else {
        throw new Error('Failed to fetch guests');
      }
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to load guests.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (user && user.role === "clerk") {
      fetchGuests()
      fetchAvailableRooms()
    }
    // eslint-disable-next-line
  }, [user])

  const fetchAvailableRooms = async () => {
    try {
      // Fetch available rooms using the new API
      const response = await fetch('/api/clerk/available-rooms', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailableRooms(data.rooms || []);
      } else {
        throw new Error('Failed to fetch available rooms');
      }
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to load available rooms.",
        variant: "destructive",
      })
    }
  }

  const filteredGuests = guests.filter((guest) => {
    const matchesSearch =
      guest.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.room?.toString().includes(searchTerm) ||
      guest.phone?.includes(searchTerm)
    const matchesFilter = filterStatus === "all" || 
      (filterStatus === "not_checked_in" && guest.checkin_status === "not_checked_in") ||
      (filterStatus === "checked_in" && guest.checkin_status === "checked_in") ||
      (filterStatus === "checked_out" && guest.checkin_status === "checked_out")
    return matchesSearch && matchesFilter
  })

  const handleCheckIn = async (guestId: string, roomId: string) => {
    setLoadingActions(prev => ({ ...prev, [`checkin-${guestId}`]: true }))
    try {
      const response = await fetch('/api/clerk/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reservationId: guestId, roomId }),
      });
      
      if (response.ok) {
        toast({
          title: "Guest Checked In",
          description: "Guest has been successfully checked in.",
        })
        await fetchGuests()
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to check in guest.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check in guest.",
        variant: "destructive",
      })
    } finally {
      setLoadingActions(prev => ({ ...prev, [`checkin-${guestId}`]: false }))
    }
  }

  const handleCheckInWithRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const roomId = formData.get("roomId") as string

    if (selectedGuestForCheckIn) {
      try {
        const response = await fetch('/api/clerk/check-in', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            reservationId: selectedGuestForCheckIn.id, 
            roomId 
          }),
        });
        
        if (response.ok) {
          toast({
            title: "Guest Checked In",
            description: `${selectedGuestForCheckIn.name} has been successfully checked in.`,
          })
          await fetchGuests()
          setIsCheckInOpen(false)
          setSelectedGuestForCheckIn(null)
        } else {
          const errorData = await response.json();
          toast({
            title: "Error",
            description: errorData.error || "Failed to check in guest.",
            variant: "destructive",
          })
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to check in guest.",
          variant: "destructive",
        })
      }
    }
  }

  const handleCheckOut = async (guestId: string) => {
    setLoadingActions(prev => ({ ...prev, [`checkout-${guestId}`]: true }))
    try {
      const response = await fetch('/api/clerk/check-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reservationId: guestId }),
      });
      
      if (response.ok) {
        toast({
          title: "Guest Checked Out",
          description: "Guest has been successfully checked out.",
        })
        await fetchGuests()
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to check out guest.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check out guest.",
        variant: "destructive",
      })
    } finally {
      setLoadingActions(prev => ({ ...prev, [`checkout-${guestId}`]: false }))
    }
  }

  const handlePrintBill = (guestId: string) => {
    const guest = guests.find((g) => g.id === guestId)
    if (guest) {
      const billContent = `
HOTEL LUXURY - GUEST BILL
=========================
Guest: ${guest.name}
Room: ${guest.room} (${guest.roomType})
Check-in: ${formatDateTime(guest.checkIn)}
Check-out: ${formatDateTime(guest.checkOut)}
Guests: ${guest.guests}
Outstanding Balance: ${formatCurrency(guest.balance)}

Thank you for staying with us!
      `
      downloadFile(billContent, `bill-${guest.name.replace(/\s+/g, "-")}-${guest.id}.txt`)
      toast({
        title: "Bill Printed",
        description: "Guest bill has been generated and downloaded.",
      })
    }
  }

  const handleAddCharges = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const amount = Number.parseFloat(formData.get("amount") as string)
    const description = formData.get("description") as string
    const notes = formData.get("notes") as string

    if (selectedGuest) {
      try {
        const response = await fetch('/api/clerk/add-charges', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reservationId: selectedGuest,
            amount,
            description,
            notes
          }),
        });
        
        if (response.ok) {
          toast({
            title: "Charges Added",
            description: `${formatCurrency(amount)} added for ${description}`,
          })
          await fetchGuests()
        } else {
          const errorData = await response.json();
          toast({
            title: "Error",
            description: errorData.error || "Failed to add charges.",
            variant: "destructive",
          })
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to add charges.",
          variant: "destructive",
        })
      }
      setIsChargesOpen(false)
      setSelectedGuest(null)
    }
  }

  const handleWalkInReservation = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    try {
      const firstName = formData.get("firstName") as string
      const lastName = formData.get("lastName") as string
      const guestName = `${firstName} ${lastName}`.trim()
      const guestEmail = formData.get("email") as string
      const guestPhone = formData.get("phone") as string
      const roomId = formData.get("room") as string
      const checkIn = formData.get("checkIn") as string
      const checkOut = formData.get("checkOut") as string
      const guests = Number(formData.get("guests") as string)

      const response = await fetch('/api/clerk/walk-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: guestName,
          email: guestEmail,
          phone: guestPhone,
          roomId,
          checkIn,
          checkOut,
          guests
        }),
      });
      
      if (response.ok) {
        toast({
          title: "Walk-in Guest Added",
          description: `${guestName} has been successfully registered.`,
        })
        await fetchGuests()
        setIsWalkInOpen(false)
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to add walk-in guest.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add walk-in guest.",
        variant: "destructive",
      })
    }
  }

  const handleProcessPayment = async (guestId: string, amount: number, paymentMethod: string) => {
    try {
      const response = await fetch('/api/clerk/process-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservationId: guestId,
          amount,
          paymentMethod,
          reference: `PAY-${Date.now()}`
        }),
      });
      
      if (response.ok) {
        toast({
          title: "Payment Processed",
          description: `${formatCurrency(amount)} payment processed successfully.`,
        })
        await fetchGuests()
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to process payment.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process payment.",
        variant: "destructive",
      })
    }
  }

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "checkin":
        toast({
          title: "Check-in",
          description: "Select a guest to check in.",
        })
        break
      case "checkout":
        toast({
          title: "Check-out",
          description: "Select a guest to check out.",
        })
        break
      case "walkin":
        setIsWalkInOpen(true)
        break
      case "charges":
        toast({
          title: "Add Charges",
          description: "Select a guest to add charges.",
        })
        break
      case "payment":
        toast({
          title: "Process Payment",
          description: "Select a guest to process payment.",
        })
        break
      case "report":
        const reportContent = `
HOTEL LUXURY - CLERK REPORT
===========================
Generated: ${new Date().toLocaleString()}

GUEST SUMMARY:
Total Guests: ${guests.length}
Checked In: ${guests.filter(g => g.checkin_status === "checked_in").length}
Checked Out: ${guests.filter(g => g.checkin_status === "checked_out").length}
Pending: ${guests.filter(g => g.checkin_status === "not_checked_in").length}

GUEST LIST:
${guests.map(g => `
- ${g.display_name} (${g.room})
  Status: ${g.status}
  Balance: ${formatCurrency(g.balance)}
`).join("")}
        `
        downloadFile(reportContent, `clerk-report-${new Date().toISOString().split("T")[0]}.txt`)
        toast({
          title: "Report Downloaded",
          description: "Clerk report has been generated and downloaded.",
        })
        break
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "no-show":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-lg">Loading clerk dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user || user.role !== "clerk") {
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
          <h1 className="text-3xl font-bold text-gray-900">Clerk Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage guest check-ins, check-outs, and hotel operations</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
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
                <UserCheck className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Checked In</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {guests.filter(g => g.checkin_status === "checked_in" && g.status === "confirmed").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <UserX className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Checked Out</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {guests.filter(g => g.checkin_status === "checked_out" && g.status === "confirmed").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {guests.filter(g => g.checkin_status === "not_checked_in" && g.status === "confirmed").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Button
              variant="outline"
              onClick={() => handleQuickAction("checkin")}
              className="h-20 flex-col"
            >
              <UserCheck className="h-6 w-6 mb-2" />
              Check In
            </Button>
            <Button
              variant="outline"
              onClick={() => handleQuickAction("checkout")}
              className="h-20 flex-col"
            >
              <UserX className="h-6 w-6 mb-2" />
              Check Out
            </Button>
            <Button
              variant="outline"
              onClick={() => handleQuickAction("walkin")}
              className="h-20 flex-col"
            >
              <Plus className="h-6 w-6 mb-2" />
              Walk-in
            </Button>
            <Button
              variant="outline"
              onClick={() => handleQuickAction("charges")}
              className="h-20 flex-col"
            >
              <CreditCard className="h-6 w-6 mb-2" />
              Add Charges
            </Button>
            <Button
              variant="outline"
              onClick={() => handleQuickAction("payment")}
              className="h-20 flex-col"
            >
              <CreditCard className="h-6 w-6 mb-2" />
              Process Payment
            </Button>
            <Button
              variant="outline"
              onClick={() => handleQuickAction("report")}
              className="h-20 flex-col"
            >
              <Download className="h-6 w-6 mb-2" />
              Generate Report
            </Button>
          </div>
        </div>

        {/* Guest Management */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Guest Management</h2>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search guests..."
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
                  <SelectItem value="not_checked_in">Pending</SelectItem>
                  <SelectItem value="checked_in">Checked In</SelectItem>
                  <SelectItem value="checked_out">Checked Out</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredGuests.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No guests found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || filterStatus !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "No guests are currently registered"}
                </p>
                {!searchTerm && filterStatus === "all" && (
                  <Button onClick={() => setIsWalkInOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Walk-in Guest
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {filteredGuests.map((guest) => (
                <Card key={guest.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{guest.display_name}</h3>
                        <p className="text-gray-600">
                          Room {guest.room} • {guest.roomType}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDateTime(guest.checkIn)} - {formatDateTime(guest.checkOut)}
                        </p>
                        {guest.is_travel_company && (
                          <Badge variant="outline" className="mt-1 bg-blue-50 text-blue-700 border-blue-200">
                            Travel Booking
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="space-y-1">
                          <Badge className={getStatusColor(guest.status)}>
                            {guest.status}
                          </Badge>
                          <div className="text-xs text-gray-500">
                            {guest.checkin_status === "not_checked_in" && "Not Checked In"}
                            {guest.checkin_status === "checked_in" && "Checked In"}
                            {guest.checkin_status === "checked_out" && "Checked Out"}
                          </div>
                        </div>
                        <p className="text-lg font-bold text-gray-900 mt-2">
                          Balance: {formatCurrency(guest.balance)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2" />
                        {guest.guests} guests
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        {guest.phone || "N/A"}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <CreditCard className="h-4 w-4 mr-2" />
                        {guest.email || "N/A"}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {guest.status === "confirmed" && guest.checkin_status === "not_checked_in" && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={loadingActions[`checkin-${guest.id}`]}
                          onClick={() => {
                            setSelectedGuestForCheckIn(guest)
                            setIsCheckInOpen(true)
                          }}
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          {loadingActions[`checkin-${guest.id}`] ? "Checking In..." : "Check In"}
                        </Button>
                      )}
                      {guest.checkin_status === "checked_in" && guest.status === "confirmed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={loadingActions[`checkout-${guest.id}`]}
                          onClick={() => handleCheckOut(guest.id)}
                        >
                          <UserX className="h-4 w-4 mr-2" />
                          {loadingActions[`checkout-${guest.id}`] ? "Checking Out..." : "Check Out"}
                        </Button>
                      )}
                      {guest.checkin_status === "checked_out" && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          Checked Out
                        </Badge>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedGuest(guest.id)
                          setIsChargesOpen(true)
                        }}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Add Charges
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePrintBill(guest.id)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Print Bill
                      </Button>
                      {guest.balance > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleProcessPayment(guest.id, guest.balance, "cash")}
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Pay Balance
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Walk-in Guest Dialog */}
      <Dialog open={isWalkInOpen} onOpenChange={setIsWalkInOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Walk-in Guest</DialogTitle>
            <DialogDescription>
              Register a new walk-in guest for immediate check-in
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleWalkInReservation} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" name="firstName" required />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" name="lastName" required />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" />
            </div>
            <div>
              <Label htmlFor="room">Room Number</Label>
              <Select name="room" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a room" />
                </SelectTrigger>
                <SelectContent>
                  {availableRooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      Room {room.number} - {room.type} (${room.price}/night)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="checkIn">Check-in Date</Label>
                <Input id="checkIn" name="checkIn" type="date" required />
              </div>
              <div>
                <Label htmlFor="checkOut">Check-out Date</Label>
                <Input id="checkOut" name="checkOut" type="date" required />
              </div>
            </div>
            <div>
              <Label htmlFor="guests">Number of Guests</Label>
              <Input id="guests" name="guests" type="number" min="1" defaultValue="1" required />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                Add Guest
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsWalkInOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Charges Dialog */}
      <Dialog open={isChargesOpen} onOpenChange={setIsChargesOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Charges</DialogTitle>
            <DialogDescription>
              Add additional charges to the guest's account
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddCharges} className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" name="amount" type="number" step="0.01" required />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" placeholder="e.g., Room service, Mini bar" required />
            </div>
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea id="notes" name="notes" placeholder="Additional notes..." />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                Add Charges
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsChargesOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Check-in Guest Dialog */}
      <Dialog open={isCheckInOpen} onOpenChange={setIsCheckInOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Check In Guest</DialogTitle>
            <DialogDescription>
              Assign a room to {selectedGuestForCheckIn?.display_name} for check-in
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCheckInWithRoom} className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Guest Information</h4>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Name:</span> {selectedGuestForCheckIn?.display_name}</p>
                <p><span className="font-medium">Room Type:</span> {selectedGuestForCheckIn?.roomType}</p>
                <p><span className="font-medium">Check-in:</span> {selectedGuestForCheckIn?.checkIn}</p>
                <p><span className="font-medium">Check-out:</span> {selectedGuestForCheckIn?.checkOut}</p>
                <p><span className="font-medium">Guests:</span> {selectedGuestForCheckIn?.guests}</p>
                {selectedGuestForCheckIn?.is_travel_company && (
                  <p><span className="font-medium text-blue-600">Type:</span> Travel Booking</p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="roomId">Assign Room</Label>
              <Select name="roomId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a room" />
                </SelectTrigger>
                <SelectContent>
                  {availableRooms
                    .filter(room => room.type === selectedGuestForCheckIn?.roomType)
                    .map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        Room {room.number} - {room.type} (${room.price}/night)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">
                Only rooms matching the reservation type are shown
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                Check In Guest
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsCheckInOpen(false)
                  setSelectedGuestForCheckIn(null)
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