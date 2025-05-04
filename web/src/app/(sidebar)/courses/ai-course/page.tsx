//@ts-nocheck
"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai"
import { useRouter } from "next/navigation"
import { FaPlus, FaTrash, FaChevronRight, FaLightbulb, FaHeartbeat, FaGraduationCap, FaCalculator, FaVideo, FaBook } from "react-icons/fa"
import { useAuth } from "@/context/AuthContext"

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY as string);

// Define the schema for research outline
const researchSchema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      id: {
        type: SchemaType.NUMBER,
        description: "Unique identifier for the research area",
        nullable: false,
      },
      title: {
        type: SchemaType.STRING,
        description: "Title of the research area",
        nullable: false,
      },
      subtopics: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            title: {
              type: SchemaType.STRING,
              description: "Title of the subtopic",
              nullable: false,
            },
            description: {
              type: SchemaType.STRING,
              description: "Description of the subtopic",
              nullable: false,
            },
            completed: {
              type: SchemaType.BOOLEAN,
              description: "Completion status of the subtopic",
              nullable: false,
            },
          },
          required: ["title", "description", "completed"],
        },
        description: "Array of subtopics for the research area",
        nullable: false,
      },
    },
    required: ["id", "title", "subtopics"],
  },
}

// Define the schema for recommended topics
const recommendedTopicsSchema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      title: {
        type: SchemaType.STRING,
        description: "Title of the recommended topic",
        nullable: false,
      },
      subtopics: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.STRING,
          description: "Name of subtopic",
        },
        description: "List of 2-3 subtopics",
        nullable: false,
      },
      icon: {
        type: SchemaType.STRING,
        description: "Icon name from [FaLightbulb, FaGraduationCap, FaHeartbeat, FaCalculator, FaVideo, FaBook]",
        nullable: false,
      },
    },
    required: ["title", "subtopics", "icon"],
  },
}

export default function AIResearchPlanner() {
  const { user } = useAuth()
  const [title, setTitle] = useState("")
  const [inputFields, setInputFields] = useState([{ value: "" }, { value: "" }])
  const router = useRouter()
  const [recommendedTopics, setRecommendedTopics] = useState<any>([])
  const [isLoading, setIsLoading] = useState(true)

  // Define the icon mapping
  const iconMap = {
    FaLightbulb: <FaLightbulb className="w-6 h-6 text-purple-500" />,
    FaGraduationCap: <FaGraduationCap className="w-6 h-6 text-purple-500" />,
    FaHeartbeat: <FaHeartbeat className="w-6 h-6 text-purple-500" />,
    FaCalculator: <FaCalculator className="w-6 h-6 text-purple-500" />,
    FaVideo: <FaVideo className="w-6 h-6 text-purple-500" />,
    FaBook: <FaBook className="w-6 h-6 text-purple-500" />,
  }

  useEffect(() => {
    const generateRecommendedTopics = async () => {
      if (!user?.onboardingAnswers) {
        setIsLoading(false)
        return
      }

      try {
        const model = genAI.getGenerativeModel({
          model: "gemini-2.0-flash",
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: recommendedTopicsSchema,
          },
        })

        const interests = Array.isArray(user.onboardingAnswers)
          ? user.onboardingAnswers.join(", ")
          : JSON.stringify(user.onboardingAnswers)

        // console.log(interests)

        const prompt = `
          Generate exactly 3 recommended course topics based on the following user interests: ${interests}.
          If interests are not mentioned, generate randomly.
          Each topic should have a title and 2-3 subtopics that would be interesting to someone with these preferences.
          Assign an appropriate icon from this list: FaLightbulb, FaGraduationCap, FaHeartbeat, FaCalculator, FaVideo, FaBook.
          Return only the JSON data conforming to the schema provided.
        `

        const result = await model.generateContent(prompt)
        const response = JSON.parse(result.response.text())

        // Map string icon names to actual React components
        const formattedTopics = response.map((topic: any) => ({
          ...topic,
          icon: iconMap[topic.icon ]
        }))

        setRecommendedTopics(formattedTopics)
      } catch (error) {
        console.error("Error generating recommended topics:", error)
        // Fallback to default topics
        setRecommendedTopics([
          {
            title: "Math SAT Exam Preparation",
            subtopics: ["Algebra Fundamentals", "Geometry Problems"],
            icon: <FaCalculator className="w-6 h-6 text-purple-500" />,
          },
          {
            title: "High School Calculus",
            subtopics: ["Derivatives", "Integration Techniques"],
            icon: <FaGraduationCap className="w-6 h-6 text-purple-500" />,
          },
          {
            title: "Creating Educational Math Videos",
            subtopics: ["Visual Explanations", "Engagement Techniques"],
            icon: <FaVideo className="w-6 h-6 text-purple-500" />,
          },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    generateRecommendedTopics()
  }, [user?.onboardingAnswers])

  const addSection = () => {
    setInputFields([...inputFields, { value: "" }])
  }

  const deleteSection = () => {
    if (inputFields.length > 1) {
      setInputFields(inputFields.slice(0, -1))
    }
  }

  const handleInputChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const values = [...inputFields]
    values[index].value = event.target.value
    setInputFields(values)
  }

  const handleGenerate = async () => {
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: researchSchema,
        },
      })

      const fieldValues = inputFields.map((field) => field.value).join(" and ")
      const prompt = `Generate a structured research outline with key areas and subtopics for a study on ${title}, focusing on '${fieldValues}'.`

      const result = await model.generateContent(prompt)
      const responseGemini = result.response.text()

      router.push(`ai-course/aivideo?title=${title}&data=${responseGemini}`)
    } catch (error) {
      console.error("Error generating research outline:", error)
    }
  }

  const handleCardClick = (topic: any) => {
    setTitle(topic.title)
    const newInputFields = topic.subtopics.map((subtopic: any) => ({
      value: subtopic,
    }))
    setInputFields(newInputFields.length > 1 ? newInputFields : [...newInputFields, { value: "" }])
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-purple-100 to-purple-300">
      {/* Left Section - Course Generator */}
      <div className="w-2/3 h-full p-8 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-5xl font-bold text-purple-800 mb-4 pt-10 font-sans">Course Generator 🚀</h1>
          <p className="text-xl text-purple-700 mb-8 font-light">
            Create personalized courses powered by AI. Specify your course focus and key topics to
            generate a comprehensive learning path.
          </p>

          <Card className="bg-white rounded-3xl shadow-2xl p-8 space-y-6">
            <div>
              <Label htmlFor="title" className="text-2xl font-semibold text-purple-800 mb-2 block">
                Course Title 📚
              </Label>
              <Input
                id="title"
                placeholder="Enter course title (e.g., 'Advanced Algebra Preparation')"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-xl text-xl py-6 bg-purple-50 placeholder-purple-400 text-purple-900 border-purple-300"
              />
            </div>

            {inputFields.map((field, index) => (
              <div key={index}>
                <Label htmlFor={`section-${index}`} className="text-2xl font-semibold text-purple-800 mb-2 block">
                  {`Topic ${index + 1} 🔍`}
                </Label>
                <Input
                  id={`section-${index}`}
                  placeholder="Enter a key topic to cover"
                  value={field.value}
                  onChange={(event) => handleInputChange(index, event)}
                  className="rounded-xl text-xl py-6 bg-purple-50 placeholder-purple-400 text-purple-900 border-purple-300"
                />
              </div>
            ))}

            <div className="flex gap-4 pt-4">
              <Button
                onClick={addSection}
                className="flex-1 rounded-xl py-6 text-xl bg-green-500 hover:bg-green-600 transition-all text-white"
              >
                <FaPlus className="w-5 h-5 mr-2" />
                Add Topic
              </Button>
              <Button
                onClick={deleteSection}
                className="flex-1 rounded-xl py-6 text-xl bg-red-500 hover:bg-red-600 transition-all text-white"
              >
                <FaTrash className="w-5 h-5 mr-2" />
                Remove Topic
              </Button>
            </div>

            <Button
              onClick={handleGenerate}
              className="w-full rounded-xl py-6 text-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all text-white font-bold shadow-lg"
            >
              Generate Course Content ✨
            </Button>
          </Card>
        </div>
      </div>

      {/* Right Section - Recommended Topics */}
      <div className="w-1/3 h-screen bg-purple-200 p-6 overflow-y-auto">
        <h2 className="text-3xl font-bold text-purple-800 mb-6">Popular Courses 🌟</h2>
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : (
            recommendedTopics.map((topic: any, index: any) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card
                  className="rounded-xl hover:shadow-2xl transition-all duration-300 cursor-pointer bg-white"
                  onClick={() => handleCardClick(topic)}
                >
                  <CardHeader className="bg-gradient-to-r from-purple-400 to-indigo-500 rounded-t-xl p-6">
                    <CardTitle className="text-2xl font-bold text-white flex items-center">
                      {/* {topic.icon} */}
                      <span className="ml-2">{topic.title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ul className="space-y-2">
                      {topic.subtopics.map((t: any, i: any) => (
                        <li key={i} className="flex items-center text-purple-900 text-lg">
                          <FaChevronRight className="w-4 h-4 mr-2 text-purple-500" />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}