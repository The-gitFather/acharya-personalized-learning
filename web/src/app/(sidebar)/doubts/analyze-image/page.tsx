"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  CloudArrowUpIcon,
  ArrowPathIcon,
  ChartBarIcon,
  LightBulbIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

const fakeChartData = [
  { name: "Mon", doubts: 4 },
  { name: "Tue", doubts: 3 },
  { name: "Wed", doubts: 5 },
  { name: "Thu", doubts: 2 },
  { name: "Fri", doubts: 6 },
  { name: "Sat", doubts: 1 },
  { name: "Sun", doubts: 3 },
];

interface AnalysisResponse {
  analysis: string;
  confidenceScore: number;
  relatedTopics: string[];
}

export default function AdvancedStudentDoubtSolver() {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [confidenceScore, setConfidenceScore] = useState(0);
  const [relatedTopics, setRelatedTopics] = useState<string[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      if (event.target?.result) {
        setImage(event.target.result as string);
      }
    };

    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif"],
    },
    multiple: false,
  });

  const handleSubmit = async () => {
    if (!image) return;

    setIsLoading(true);
    setAnalysis(null);
    setConfidenceScore(0);
    setRelatedTopics([]);

    try {
      const response = await fetch("/api/analyze-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageData: image }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze image");
      }

      const data = await response.json() as AnalysisResponse;
      // setAnalysis(data.analysis);

      // // Simulating additional data
      // setConfidenceScore(Math.random() * 100);
      // setRelatedTopics(
      //   ["Mathematics", "Physics", "Chemistry", "Biology"]
      //     .sort(() => 0.5 - Math.random())
      //     .slice(0, 3)
      // );


      // Now we can directly use all the fields from the API response
      setAnalysis(data.analysis);
      setConfidenceScore(data.confidenceScore);
      setRelatedTopics(data.relatedTopics);


    } catch (error) {
      console.error("Error:", error);
      setAnalysis("Failed to analyze image. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // useEffect(() => {
  //   if (analysis) {
  //     const timer = setTimeout(() => {
  //       setConfidenceScore(Math.random() * 100);
  //     }, 1000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [analysis]);

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.h1
          className="text-4xl font-bold text-center text-blue-600 mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Advanced Student Doubt Solver
        </motion.h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            className="bg-white shadow-lg rounded-lg p-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl font-semibold mb-4 text-blue-500">
              Upload Your Doubt
            </h2>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-md p-8 text-center cursor-pointer transition-all duration-300 ${
                isDragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
              }`}
            >
              <input {...getInputProps()} />
              <CloudArrowUpIcon className="mx-auto h-12 w-12 text-blue-400" />
              <p className="mt-2 text-sm text-gray-600">
                Drag and drop an image here, or click to select a file
              </p>
            </div>
            {image && (
              <motion.div
                className="mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Image
                  src={image}
                  alt="Uploaded image"
                  width={300}
                  height={300}
                  className="mx-auto rounded-md shadow-md"
                />
              </motion.div>
            )}
            <motion.button
              className="mt-4 w-full bg-blue-500 text-white py-3 px-4 rounded-md hover:bg-blue-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              onClick={handleSubmit}
              disabled={!image || isLoading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isLoading ? (
                <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
              ) : (
                <LightBulbIcon className="h-5 w-5 mr-2" />
              )}
              {isLoading ? "Analyzing..." : "Analyze Image"}
            </motion.button>
          </motion.div>
          <motion.div
            className="bg-white shadow-lg rounded-lg p-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl font-semibold mb-4 text-blue-500">
              Doubt Analytics
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={fakeChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="doubts"
                  stroke="#3B82F6"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Weekly Doubt Summary
              </h3>
              <p className="text-sm text-gray-600">
                Track your learning progress and identify areas for improvement.
              </p>
            </div>
          </motion.div>
        </div>
        <AnimatePresence>
          {analysis && (
            <motion.div
            className="mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-blue-500">
                  Analysis Result
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="col-span-2 prose prose-blue max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({node, inline, className, children, ...props}) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={atomDark}
                              language={match[1]}
                              PreTag="div"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        },
                        h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-xl font-semibold mt-5 mb-3" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-lg font-medium mt-4 mb-2" {...props} />,
                        p: ({node, ...props}) => <p className="my-2 text-gray-700" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-4 my-2" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-4 my-2" {...props} />,
                        blockquote: ({node, ...props}) => (
                          <blockquote className="border-l-4 border-blue-500 pl-4 my-4 italic" {...props} />
                        ),
                      }}
                    >
                      {analysis}
                    </ReactMarkdown>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        Confidence Score
                      </h3>
                      <div className="relative pt-1">
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                          <motion.div
                            style={{ width: `${confidenceScore}%` }}
                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                            initial={{ width: "0%" }}
                            animate={{ width: `${confidenceScore}%` }}
                            transition={{ duration: 1 }}
                          />
                        </div>
                        <p className="text-right text-blue-600 font-medium">
                          {confidenceScore.toFixed(2)}%
                        </p>
                      </div>
                    </div>
      
                    <div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        Related Topics
                      </h3>
                      <ul className="space-y-2">
                        {relatedTopics.map((topic, index) => (
                          <motion.li
                            key={index}
                            className="flex items-center text-gray-600 p-2 rounded-lg hover:bg-gray-50"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <AcademicCapIcon className="h-5 w-5 mr-2 text-blue-500" />
                            {topic}
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
