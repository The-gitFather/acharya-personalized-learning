//@ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MapPin,
  Building,
  Briefcase,
  Calendar,
  Clock,
  Book,
  Tag,
  User,
  Mail,
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import dynamic from "next/dynamic";
import { icon } from "leaflet"; // Import Leaflet's icon function directly

// Dynamically import Leaflet components with no SSR to avoid window not defined errors
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

const data = [
  {
    id: 1,
    district: "Pathankot",
    trainingPartner: "Shri Krishna Education Trust",
    trainingCentre: "Shri Krishna Education Trust",
    schemeName: "DUGKY",
    sector: "Rubber",
    course: "Junior Technician / Technical Assistant-RSC/Q0831",
    startDate: "15/01/2019",
    startTime: "8:30 AM",
    lat: 32.2895, // Latitude for Pathankot
    lng: 75.6521, // Longitude for Pathankot
    email: "contact@shrikrishnaedu.com",
  },
  {
    id: 2,
    district: "Pathankot",
    trainingPartner: "Govt ITI Boys",
    trainingCentre: "Govt ITI Boys",
    schemeName: "PMKVY-II",
    sector: "Tourism & Hospitality",
    course: "Food & Beverage Service-THC/Q0301",
    startDate: "15/09/2018",
    startTime: "9:30 AM",
    lat: 32.28, // Latitude for Pathankot
    lng: 75.6525, // Longitude for Pathankot
    email: "contact@govtiti.com",
  },
  {
    id: 3,
    district: "Pathankot",
    trainingPartner: "Govt ITI Boys",
    trainingCentre: "Govt ITI Boys",
    schemeName: "PMKVY-II",
    sector: "Tourism & Hospitality",
    course: "Room Attendant-THC/Q0501",
    startDate: "25/12/2018",
    startTime: "9:30 AM",
    lat: 32.2805, // Latitude for Pathankot
    lng: 75.6523, // Longitude for Pathankot
    email: "contact@govtiti.com",
  },
  {
    id: 4,
    district: "Mohali",
    trainingPartner: "Sebiz Infotech Pvt Ltd.",
    trainingCentre: "Sebiz Training Centre Derabassi",
    schemeName: "NULM",
    sector: "Automotive",
    course: "Dealership Telecaller Sales Executive-ASC/Q1011",
    startDate: "25/11/2018",
    startTime: "10:00 AM",
    lat: 30.6715, // Latitude for Mohali
    lng: 76.6931, // Longitude for Mohali
    email: "contact@sebizinfotech.com",
  },
  {
    id: 5,
    district: "Mohali",
    trainingPartner: "Hair Raiserz LLP",
    trainingCentre: "Pracheen Kala Kendra, Mohali",
    schemeName: "NULM",
    sector: "Beauty & Wellness",
    course: "Beauty Therapist-BWS/Q0102",
    startDate: "12/11/2018",
    startTime: "9:00 AM",
    lat: 30.6911, // Latitude for Mohali
    lng: 76.7145, // Longitude for Mohali
    email: "contact@hairraiserz.com",
  },
  {
    id: 6,
    district: "Mohali",
    trainingPartner: "Indo Global Education Foundation",
    trainingCentre: "Indo Global Education Foundation",
    schemeName: "NULM",
    sector: "Beauty & Wellness",
    course: "Beauty Therapist-BWS/Q0102",
    startDate: "03/12/2018",
    startTime: "9:00 AM",
    lat: 30.6671, // Latitude for Mohali
    lng: 76.7343, // Longitude for Mohali
    email: "contact@indoglobaledu.com",
  },
  {
    id: 7,
    district: "Mohali",
    trainingPartner: "Govt ITI Lalru",
    trainingCentre: "Govt Industrial Training Institute Lalru",
    schemeName: "PMKVY-II",
    sector: "Capital Goods",
    course: "Fitter Fabrication and Manual Arc Welding/Shield Welding",
    startDate: "25/12/2018",
    startTime: "9:30 AM",
    lat: 30.7192, // Latitude for Mohali
    lng: 76.6653, // Longitude for Mohali
    email: "contact@govtiti-lalru.com",
  },
];

// Custom icon for markers
const customIcon = () => {
  // Need to check if window is defined (client-side only)
  if (typeof window !== "undefined") {
    return icon({
      iconUrl: "https://cdn-icons-png.flaticon.com/512/447/447031.png",
      iconSize: [40, 40],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });
  }
  return null;
};

export default function HybridCoursesPage() {
  const [filter, setFilter] = useState("");
  const [selectedEmail, setSelectedEmail] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // Set mapReady to true when component mounts (client-side only)
  useEffect(() => {
    setMapReady(true);
  }, []);

  const filteredData = data.filter((course) =>
    Object.values(course).some((value) =>
      value.toString().toLowerCase().includes(filter.toLowerCase())
    )
  );

  const handleEmailClick = (email) => {
    setSelectedEmail(email);
    setIsModalOpen(true);
  };

  const handleSendEmail = () => {
    setIsModalOpen(false);
    // Here you would typically implement the actual email sending logic
  };

  // Group courses by district for better organization
  const coursesByDistrict = filteredData.reduce((acc, course) => {
    if (!acc[course.district]) {
      acc[course.district] = [];
    }
    acc[course.district].push(course);
    return acc;
  }, {});

  return (
    <div className="container mx-auto py-10 px-6">
      {/* <Navbar></Navbar> */}
      <h1 className="text-3xl font-bold mb-6 pt-24">Hybrid Courses</h1>

      <div className="mb-6">
        <Input
          placeholder="Search courses..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
          aria-label="Search courses"
        />
      </div>

      <div className="mb-6 h-[400px] w-full rounded-lg overflow-hidden shadow-md">
        {mapReady && (
          <MapContainer
            center={[31.1471, 75.3412]} // Center of Punjab
            zoom={8}
            style={{ height: "400px", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filteredData.map((course) => (
              <Marker
                key={course.id}
                position={[course.lat, course.lng]}
                icon={customIcon()}
              >
                <Popup>
                  <div className="text-sm">
                    <h3 className="font-bold text-base mb-1">{course.course}</h3>
                    <p>
                      <strong>District:</strong> {course.district}
                    </p>
                    <p>
                      <strong>Training Partner:</strong> {course.trainingPartner}
                    </p>
                    <p>
                      <strong>Training Centre:</strong> {course.trainingCentre}
                    </p>
                    <p>
                      <strong>Scheme Name:</strong> {course.schemeName}
                    </p>
                    <p>
                      <strong>Sector:</strong> {course.sector}
                    </p>
                    <p>
                      <strong>Start Date:</strong> {course.startDate}
                    </p>
                    <p>
                      <strong>Start Time:</strong> {course.startTime}
                    </p>
                    <p>
                      <strong>Email:</strong>{" "}
                      <span 
                        className="text-blue-500 cursor-pointer"
                        onClick={() => handleEmailClick(course.email)}
                      >
                        {course.email}
                      </span>
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>

      {/* Display courses grouped by district */}
      {Object.keys(coursesByDistrict).length > 0 ? (
        Object.entries(coursesByDistrict).map(([district, courses]) => (
          <div key={district} className="mb-8">
            <h2 className="text-xl font-semibold mb-4">{district} District</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="p-4 pb-2 bg-gray-50">
                    <CardTitle className="text-lg font-bold line-clamp-2">
                      {course.course}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div className="flex items-center">
                        <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{course.district}</span>
                      </div>
                      <div className="flex items-center">
                        <User className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{course.trainingPartner}</span>
                      </div>
                      <div className="flex items-center">
                        <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{course.trainingCentre}</span>
                      </div>
                      <div className="flex items-center">
                        <Tag className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{course.schemeName}</span>
                      </div>
                      <div className="flex items-center">
                        <Book className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{course.sector}</span>
                      </div>
                      <div className="flex items-center col-span-2">
                        <Briefcase className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{course.course}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{course.startDate}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{course.startTime}</span>
                      </div>

                      <div className="flex items-center col-span-2">
                        <Mail
                          className="mr-2 h-4 w-4 text-muted-foreground cursor-pointer"
                          onClick={() => handleEmailClick(course.email)}
                        />
                        <button
                          className="truncate text-blue-500 cursor-pointer text-left hover:underline"
                          onClick={() => handleEmailClick(course.email)}
                          aria-label={`Email ${course.trainingCentre}`}
                        >
                          {course.email}
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-10">
          <p className="text-lg text-gray-600">No courses match your search criteria</p>
        </div>
      )}

      {/* Email Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">New Message</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded"
                  aria-label="Minimize"
                >
                  −
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-4">
              <div className="space-y-4">
                <div className="flex items-center border-b py-2">
                  <span className="text-gray-600 w-16">To</span>
                  <input
                    type="email"
                    value={selectedEmail}
                    readOnly
                    className="flex-1 outline-none"
                    aria-label="Recipient email"
                  />
                </div>
                <div className="flex items-center border-b py-2">
                  <span className="text-gray-600 w-16">Subject</span>
                  <input
                    type="text"
                    placeholder="Subject"
                    className="flex-1 outline-none"
                    aria-label="Email subject"
                  />
                </div>
                <textarea
                  className="w-full h-64 outline-none resize-none p-2 border rounded"
                  placeholder="Write your message here..."
                  aria-label="Email message"
                />
              </div>
            </div>

            <div className="p-4 border-t flex items-center gap-4">
              <button
                onClick={handleSendEmail}
                className="bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 font-medium"
              >
                Send
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Delete draft"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}