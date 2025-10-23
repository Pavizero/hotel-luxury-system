"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Star } from "lucide-react"
import { useState } from "react"
import { DatabaseTester } from "@/components/database-tester"

export default function HomePage() {
  // Use the same room types as in reservation page for consistency
  const [rooms] = useState([
    {
      id: "deluxe",
      name: "Deluxe Ocean View",
      price: 15000,
      description: "Spacious room with stunning ocean views and modern amenities.",
      image: "/images/sri-lanka-hotel-hero.jpg",
      rating: 4.5,
      reviews: 120,
    },
    {
      id: "suite",
      name: "Executive Suite",
      price: 28000,
      description: "Luxurious suite with separate living area and premium amenities.",
      image: "/images/sri-lanka-hotel-about.jpg",
      rating: 4.7,
      reviews: 85,
    },
    {
      id: "villa",
      name: "Beach Villa",
      price: 45000,
      description: "Private villa with direct beach access and personal butler service.",
      image: "/images/sri-lanka-hotel-contact.jpg",
      rating: 4.8,
      reviews: 50,
    },
  ])

  const hotelInfo = {
    name: "Hotel Luxury",
    location: "Colombo, Sri Lanka",
    description:
      "Experience unparalleled luxury and comfort at Hotel Luxury, nestled in the heart of Colombo. Our exquisite rooms, world-class amenities, and impeccable service ensure a memorable stay.",
    rating: 4.7,
    reviews: 500,
    image: "/images/sri-lanka-hotel-hero.jpg",
  }

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden">
          <Image
            alt="Hotel Luxury Hero"
            className="object-cover w-full h-full"
            height={1080}
            src={hotelInfo.image || "/placeholder.svg"}
            style={{
              aspectRatio: "1920/1080",
              objectFit: "cover",
            }}
            width={1920}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-center justify-center px-4 text-center">
            <div className="max-w-3xl space-y-4">
              <h1 className="text-4xl font-bold tracking-tighter text-white sm:text-5xl md:text-6xl">
                {hotelInfo.name}
              </h1>
              <p className="text-lg text-gray-200 md:text-xl">{hotelInfo.description}</p>
              <div className="flex items-center justify-center gap-2 text-white">
                <MapPin className="w-5 h-5" />
                <span>{hotelInfo.location}</span>
                <span className="mx-2">|</span>
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span>
                  {hotelInfo.rating} ({hotelInfo.reviews} Reviews)
                </span>
              </div>
              <Link href="/reservation">
                <Button className="mt-6 px-8 py-3 text-lg bg-primary-500 hover:bg-primary-600 text-white">
                  Book Your Stay
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Rooms Section */}
        <section className="py-12 md:py-20 lg:py-24 bg-gray-100 dark:bg-gray-800">
          <div className="container px-4 md:px-6">
            <div className="text-center space-y-4 mb-10">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Our Rooms & Suites</h2>
              <p className="max-w-[700px] mx-auto text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                Discover our exquisite collection of rooms and suites, designed for your ultimate comfort and
                relaxation.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <Card key={room.id} className="flex flex-col overflow-hidden">
                  <Image
                    alt={room.name}
                    className="w-full h-48 object-cover"
                    height={400}
                    src={room.image || "/placeholder.svg"}
                    style={{
                      aspectRatio: "600/400",
                      objectFit: "cover",
                    }}
                    width={600}
                  />
                  <CardHeader>
                    <CardTitle>{room.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-gray-500 dark:text-gray-400 mb-2">{room.description}</p>
                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>
                        {room.rating} ({room.reviews} reviews)
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary-600">
                      {room.price.toLocaleString("en-US", { style: "currency", currency: "LKR" })}
                    </span>
                    <Link href={`/room/${room.id}`}>
                      <Button>View Details</Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Database Tester Section */}
        <section className="py-12 md:py-20 lg:py-24 bg-white dark:bg-gray-900">
          <div className="container px-4 md:px-6">
            <div className="text-center space-y-4 mb-10">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Database Diagnostics</h2>
              <p className="max-w-[700px] mx-auto text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                Use these tools to test and debug your database connection and operations.
              </p>
            </div>
            <DatabaseTester />
          </div>
        </section>
      </main>
    </div>
  )
}