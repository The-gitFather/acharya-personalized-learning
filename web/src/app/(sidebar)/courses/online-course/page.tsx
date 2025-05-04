//@ts-nocheck
"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";

// Utility function to randomly assign cost values
function getRandomCost() {
  const costs = ["₹ Low", "₹ Medium", "₹ High"];
  return costs[Math.floor(Math.random() * costs.length)];
}

async function searchCourses(query: string) {
  const url = `/api/course?query=${query}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch courses");
  }
  return res.json();
}

function CourseCard({ course }: { course: any }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-2 p-4">
        <div className="flex items-center space-x-2">
          {course.favicon && (
            <img
              src={course.favicon}
              alt={course.source}
              width={16}
              height={16}
              className="rounded-full"
            />
          )}
          <span className="text-sm font-medium">{course.source}</span>
        </div>
        <h3 className="text-lg font-bold line-clamp-2">{course.title}</h3>
      </CardHeader>
      <CardContent className="space-y-2 p-4 pt-0">
        <p className="text-sm text-muted-foreground line-clamp-3">{course.snippet}</p>
        <div className="flex justify-between items-center">
          <a href={course.link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
            Learn More
          </a>
          <div className="flex space-x-2 items-center">
            {course.position && <Badge variant="secondary">Rank: {course.position}</Badge>}
            <Badge variant="outline">{course.cost}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SearchForm({ onSearch }: { onSearch: (query: string) => void }) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm items-center space-x-2">
      <Input
        type="text"
        placeholder="Search courses..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <Button type="submit">
        <Search className="mr-2 h-4 w-4" />
        Search
      </Button>
    </form>
  );
}

function RecommendedSearches({ onSearch }: { onSearch: (query: string) => void }) {
  const [recommendedSkills, setRecommendedSkills] = useState([
    {
      title: "Cloud Computing",
      subtopics: ["AWS", "Docker"],
    },
    {
      title: "Machine Learning",
      subtopics: [
        "Supervised vs Unsupervised Learning",
        "Machine Learning Model Evaluation",
      ],
    },
    {
      title: "DevOps",
      subtopics: ["Introduction to DevOps", "CI/CD Pipelines"],
    },
  ]);

  const gradients = [
    "from-purple-500 to-pink-500",
    "from-cyan-500 to-blue-500",
    "from-green-500 to-teal-500",
  ];

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">Recommended Searches</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recommendedSkills.map((skill, index) => (
          <div key={skill.title} className={`p-4 rounded-lg bg-gradient-to-r ${gradients[index % gradients.length]}`}>
            <h3 className="text-lg font-semibold text-white mb-2 cursor-pointer hover:underline" onClick={() => onSearch(skill.title)}>
              {skill.title}
            </h3>
            <ul className="space-y-1">
              {skill.subtopics.map((subtopic) => (
                <li key={subtopic} className="text-sm text-white cursor-pointer hover:underline" onClick={() => onSearch(subtopic)}>
                  {subtopic}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StructuredCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await searchCourses(query);
      const coursesWithCost = (data.organic_results || []).map((course: any) => ({
        ...course,
        cost: getRandomCost(),
      }));
      setCourses(coursesWithCost);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses("web development"); // Default search
  }, []);

  const handleSearch = (query: string) => {
    fetchCourses(query);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Course Search</h1>
          <SearchForm onSearch={handleSearch} />
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <RecommendedSearches onSearch={handleSearch} />
        {loading && <p>Loading courses...</p>}
        {error && <p className="text-red-500">{error}</p>}
        <h2 className="text-xl font-semibold mb-4"> Courses based on Search</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {!loading &&
            courses.map((course: any) => <CourseCard key={course.position} course={course} />)}
        </div>
      </main>
    </div>
  );
}