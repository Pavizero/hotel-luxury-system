"use client"

import { useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Star, Wifi, Coffee, Car, Users, Calendar } from "lucide-react"

export default function RoomDetailsPage() {
  const params = useParams()
  const roomId = params.id as string

  const rooms = {
    deluxe: {
      id: "deluxe",
      name: "Deluxe Ocean View",
      price: 15000,
      description: "Spacious room with stunning ocean views and modern amenities.",
      longDescription: "Experience the perfect blend of luxury and comfort in our Deluxe Ocean View rooms. Each room features floor-to-ceiling windows offering breathtaking views of the Indian Ocean, premium bedding, and state-of-the-art amenities. Perfect for both business and leisure travelers.",
      image: "/images/sri-lanka-hotel-hero.jpg",
      rating: 4.5,
      reviews: 120,
      features: ["Ocean View", "King Bed", "Balcony", "Free WiFi", "Mini Bar", "Room Service"],
      amenities: ["Air Conditioning", "Flat-screen TV", "Coffee Maker", "Hair Dryer", "Safe", "Iron"],
      size: "45 sqm",
      maxGuests: 3,
      bedType: "1 King Bed + 1 Sofa Bed",
    },
    suite: {
      id: "suite",
      name: "Executive Suite",
      price: 28000,
      description: "Luxurious suite with separate living area and premium amenities.",
      longDescription: "Our Executive Suite offers the ultimate in luxury accommodation. Featuring a separate living area, dining space, and premium amenities, this suite is perfect for extended stays or special occasions. Enjoy personalized service and exclusive access to our executive lounge.",
      image: "/images/sri-lanka-hotel-about.jpg",
      rating: 4.7,
      reviews: 85,
      features: ["Separate Living Area", "Executive Lounge Access", "Butler Service", "Premium Amenities", "City View", "Dining Area"],
      amenities: ["Air Conditioning", "2 Flat-screen TVs", "Coffee Maker", "Hair Dryer", "Safe", "Iron", "Kitchenette"],
      size: "75 sqm",
      maxGuests: 4,
      bedType: "1 King Bed + 1 Queen Sofa Bed",
    },
    villa: {
      id: "villa",
      name: "Beach Villa",
      price: 45000,
      description: "Private villa with direct beach access and personal butler service.",
      longDescription: "Experience ultimate privacy and luxury in our exclusive Beach Villa. With direct beach access, private pool, and dedicated butler service, this villa offers an unparalleled luxury experience. Perfect for families or those seeking complete privacy and exclusivity.",
      image: "/images/sri-lanka-hotel-contact.jpg",
      rating: 4.8,
      reviews: 50,
      features: ["Private Pool", "Direct Beach Access", "Butler Service", "Private Garden", "Kitchen", "Multiple Bedrooms"],
      amenities: ["Air Conditioning", "Multiple TVs", "Full Kitchen", "Hair Dryer", "Safe", "Iron", "Private Pool"],
      size: "120 sqm",
      maxGuests: 6,
      bedType: "2 King Beds + 2 Twin Beds",
    },
  }

  const room = rooms[roomId as keyof typeof rooms]

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Room Not Found</h1>
          <p className="text-gray-600 mb-6">The room you're looking for doesn't exist.</p>
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            Home
          </Link>
          <span className="mx-2 text-gray-500">/</span>
          <span className="text-gray-900">{room.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="space-y-4">
            <div className="relative h-96 lg:h-[500px] rounded-lg overflow-hidden">
              <Image
                src={room.image}
                alt={room.name}
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{room.name}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>{room.rating} ({room.reviews} reviews)</span>
                </div>
                <span>•</span>
                <span>{room.size}</span>
                <span>•</span>
                <span>Up to {room.maxGuests} guests</span>
              </div>
              <p className="text-lg text-gray-700">{room.longDescription}</p>
            </div>

            {/* Price and Booking */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-3xl font-bold text-blue-600">
                      {room.price.toLocaleString("en-US", { style: "currency", currency: "LKR" })}
                    </span>
                    <span className="text-gray-600 ml-2">per night</span>
                  </div>
                  <Link href={`/reservation?roomType=${room.id}`}>
                    <Button size="lg" className="px-8">
                      Book Now
                    </Button>
                  </Link>
                </div>
                <div className="text-sm text-gray-600">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4" />
                    <span>Free cancellation up to 24 hours before check-in</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Maximum {room.maxGuests} guests</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Room Features</h3>
              <div className="grid grid-cols-2 gap-3">
                {room.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-gray-700">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Amenities</h3>
              <div className="grid grid-cols-2 gap-3">
                {room.amenities.map((amenity) => (
                  <div key={amenity} className="flex items-center gap-2 text-gray-700">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Room Details */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Room Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Room Size:</span>
                  <span className="ml-2 text-gray-600">{room.size}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Bed Type:</span>
                  <span className="ml-2 text-gray-600">{room.bedType}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Maximum Guests:</span>
                  <span className="ml-2 text-gray-600">{room.maxGuests}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">View:</span>
                  <span className="ml-2 text-gray-600">
                    {room.id === "deluxe" ? "Ocean View" : room.id === "suite" ? "City View" : "Garden View"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 