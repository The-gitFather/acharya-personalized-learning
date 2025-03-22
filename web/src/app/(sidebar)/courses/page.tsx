"use client"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { GraduationCap, Laptop, Globe } from "lucide-react"
import { useEffect, useState } from 'react'

const FloatingShape = ({ index }: { index: number }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    // More controlled positioning for better aesthetics
    setPosition({
      x: (index % 3) * 30 + Math.random() * 20,
      y: Math.floor(index / 3) * 30 + Math.random() * 20,
    })
  }, [index])

  return (
    <motion.div
      className="absolute bg-blue-200/5 rounded-full backdrop-blur-xl"
      style={{
        // Smaller, more controlled sizes
        width: Math.max(100, Math.random() * 180 + 80),
        height: Math.max(100, Math.random() * 180 + 80),
      }}
      animate={{
        x: [position.x + "%", (position.x + 5) + "%"],
        y: [position.y + "%", (position.y + 5) + "%"],
      }}
      transition={{
        duration: Math.random() * 10 + 30,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut",
      }}
    />
  )
}

const CourseCard = ({ title, icon: Icon, href, description, imageSrc }: any) => (
  <Link href={href} className="block">
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className="group relative bg-white rounded-lg overflow-hidden h-[420px] transition-all duration-300 shadow-md hover:shadow-xl"
    >
      <div className="absolute inset-0">
        <Image
          src={imageSrc}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      </div>

      <div className="relative h-full flex flex-col justify-end p-6">
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2.5 shadow-md">
          <Icon className="w-5 h-5 text-blue-500" />
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-white tracking-tight">
            {title}
          </h2>

          <p className="text-white/80 text-sm leading-relaxed line-clamp-3">
            {description}
          </p>

          <div className="pt-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center px-4 py-1.5 bg-white/90 backdrop-blur-sm rounded-2xl text-blue-600 text-sm font-medium shadow-sm"
            >
              Explore
              <svg className="w-3.5 h-3.5 ml-1.5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  </Link>
)

const Page = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-100/70 relative overflow-hidden">
      <div className="fixed inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <FloatingShape key={i} index={i} />
        ))}
      </div>

      <div className="fixed inset-0 opacity-20" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, #CBD5E1 1px, transparent 0)',
        backgroundSize: '30px 30px'
      }} />

      <main className="relative min-h-screen flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-7xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12 md:mb-16"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 tracking-tight">
              Embark on Your{' '}
              <span className="bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 bg-clip-text text-transparent">
                Learning Journey
              </span>
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-gray-600 text-lg">
              Discover courses designed to expand your horizons and accelerate growth
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <CourseCard
              title="AI Mastery"
              icon={GraduationCap}
              href="/courses/ai-course"
              description="Unlock the power of Artificial Intelligence. From machine learning algorithms to neural networks, dive deep into the technology shaping our future. Perfect for aspiring data scientists and AI enthusiasts."
              imageSrc="/ai.png"
            />
            <CourseCard
              title="Hybrid Learning Experience"
              icon={Laptop}
              href="/courses/hybrid-course"
              description="Get the best of both worlds with our hybrid course. Combine the flexibility of online learning with the engagement of in-person workshops. Ideal for those seeking a balanced and comprehensive educational experience."
              imageSrc="/offline.png"
            />
            <CourseCard
              title="Global Online Academy"
              icon={Globe}
              href="/courses/online-course"
              description="Learn without limits. Our online courses offer unparalleled flexibility, allowing you to study from anywhere in the world. Access expert-led lectures, interactive assignments, and a global community of learners."
              imageSrc="/online.png"
            />
          </div>
        </div>
      </main>
    </div>
  )
}

export default Page