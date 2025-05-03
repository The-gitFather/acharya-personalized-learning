"use client";

import { useState, useEffect } from "react";
import {
    ChevronDown,
    Star,
    Clock,
    Users,
    Play,
    Share2,
    MoreVertical,
    Box,
    Text,
    Check,
    LanguagesIcon,
    X,
    Square,
    Ellipsis,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useSearchParams } from "next/navigation";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
// import YoutubeSearch from "@/components/Transcripts";
import axios from "axios";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import Groq from "groq-sdk";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey!);
// import { Navbar } from "@/components/navbar";

const groq = new Groq({
    apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
    dangerouslyAllowBrowser: true,
});
const questionsSchema = {
    type: SchemaType.ARRAY,
    items: {
        type: SchemaType.OBJECT,
        properties: {
            id: {
                type: SchemaType.NUMBER,
                description: "Unique identifier for the question",
                nullable: false,
            },
            question: {
                type: SchemaType.STRING,
                description: "The multiple choice question text",
                nullable: false,
            },
            answer: {
                type: SchemaType.ARRAY,
                items: {
                    type: SchemaType.STRING,
                    description: "Multiple choice options",
                },
                description: "Array of four possible answers",
                nullable: false,
            },
            correctAns: {
                type: SchemaType.STRING,
                description: "The correct answer from the options",
                nullable: false,
            },
        },
        required: ["id", "question", "answer", "correctAns"],
    },
};

interface Video {
    id: {
        videoId: string;
    };
}

interface Question {
    id: string;
    question: string;
    answer: string[];
    correctAns: string;
}

interface YoutubeSearchProps {
    title: string;
}

interface Question {
    id: string;
    question: string;
    answer: string[];
}

interface QuestionsProps {
    ques: Question[] | null;
}

export default function CoursePage() {
    const [selected, setSelected] = useState({ unit: 1, chapter: 1, title: "" });
    const [ques, setques] = useState([]);
    const searchParams = useSearchParams();
    // console.log("search: ", searchParams);
    const data: any = searchParams.get("data");
    const title = searchParams.get("title");
    const [selectedTitle, setSelectedTitle] = useState("");
    const [dubbedVideo, setDubbedVideo] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("");
    const [error, setError] = useState("");
    const [selectedAnswers, setSelectedAnswers] = useState<
        Record<string, string>
    >({});
    const [isLocked, setIsLocked] = useState<Record<string, boolean>>({});
    const router = useRouter();
    // console.log(data);

    const handleAnswerSelection = (
        questionId: string,
        selectedOption: string
    ) => {
        // Allow selection only if the answer is not locked
        if (!isLocked[questionId]) {
            setSelectedAnswers((prev) => ({
                ...prev,
                [questionId]: selectedOption,
            }));

            // Lock the question after selection
            setIsLocked((prev) => ({
                ...prev,
                [questionId]: true,
            }));
        }
    };

    const [course, setCourse] = useState([]);

    useEffect(() => {
        try {
            const parsedData = JSON.parse(data);
            const modifiedData = parsedData.map((topic: { subtopics: any[] }) => {
                return {
                    ...topic,
                    subtopics: topic.subtopics.map((subtopic) => ({
                        ...subtopic,
                        completed: false,
                    })),
                };
            });
            // console.log(modifiedData);

            setCourse(modifiedData);
            if (parsedData.length > 0 && parsedData[0].subtopics.length > 0) {
                setSelected((prevSelected) => ({
                    ...prevSelected,
                    title: parsedData[0].subtopics[0],
                }));
            }
        } catch (error) {
            console.error("Error parsing JSON:", error);
        }
    }, [data]);

    const handleSubtopicClick = (unit: any, chapter: any, title: any) => {
        setSelected({ unit, chapter, title });
    };

    const [videos, setVideos] = useState<Video[]>([]);
    const [videoSummary, setVideoSummary] = useState<string>("");
    const [questions, setQuestions] = useState<Question[]>([]);

    const API_KEY: string = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY as string;

    const handleSearch = async (titleSelected: any): Promise<void> => {
        console.log(titleSelected);

        try {
            const response = await axios.get(
                `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&q=${title + " " + titleSelected.title
                }&videoDuration=medium&videoEmbeddable=true&type=video&maxResults=5`
            );

            const items: Video[] = response.data.items;
            console.log("Videos: ", videos);
            setVideos(items);

            if (items.length > 0) {
                // console.log(items);
                const videoId = items[0].id.videoId;
                // const videoTitle = items[0]
                const summary = await summarizeVideo(videoId);
                setVideoSummary(summary);
            }
        } catch (error) {
            console.error("Error fetching YouTube data:", error);
        }
    };

    const summarizeVideo = async (videoId: string): Promise<string> => {
        try {
            // Generate a summary using Groq's chat completion API
            const chatCompletion = await groq.chat.completions.create({
                messages: [
                    {
                        role: "user",
                        content: `Write a random paragraph about the YouTube video related to ${title}. The paragraph should be at least 100 words long and it should just be the summary`,
                    },
                ],
                model: "llama3-70b-8192",
                temperature: 0.2,
                max_completion_tokens: 500,
                top_p: 1,
                stream: false,
                stop: null,
            });

            // Extract the generated summary from the response
            const summary: any = chatCompletion.choices[0].message.content;
            console.log("Summary:", summary);

            // Generate questions and answers based on the summary
            await generateQuestionsAndAnswers(summary);

            return summary;
        } catch (error) {
            console.error("Error generating summary:", error);
            return "";
        }
    };
    const generateQuestionsAndAnswers = async (
        summary: string
    ): Promise<void> => {
        try {
            const model = genAI.getGenerativeModel({
                model: "gemini-1.5-flash",
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: questionsSchema,
                },
            });

            const prompt = `Based on the video summary provided, generate 5 multiple-choice questions related to the content. Each question should have four possible answers.
      Video Summary: '${summary}'`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            const parsedResponse = JSON.parse(text) as Question[];

            console.log("Generated questions:", parsedResponse);
            setques(parsedResponse as any);
        } catch (error) {
            console.error("Error generating questions and answers:", error);
        }
    };

    const handlevideoDubbing = async (url: string) => {
        const messages = [
            "Transcribing video",
            "Translating to Punjabi",
            "Converting Text-to-Speech",
            "Merging Audios",
            "Replacing original video with dubbed audio",
        ];

        setLoading(true);
        let messageIndex = 0;

        const messageInterval = setInterval(() => {
            setLoadingMessage(messages[messageIndex]);
            messageIndex = (messageIndex + 1) % messages.length;
        }, 3000);

        try {
            const response = await axios.post("http://localhost:5000/process-video", {
                url: url,
            });

            if (response.data.success) {
                setDubbedVideo(response.data.video_url);
            } else {
                alert("Failed to process the video.");
            }
        } catch (error) {
            alert("An error occurred while processing the video.");
        } finally {
            clearInterval(messageInterval);
            setLoading(false);
            setLoadingMessage("");
        }
    };

    const handleCertify = () => {
        router.push(`/certify?title=${title}`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-100 to-purple-300">
            <div className="flex flex-col lg:flex-row">
                {/* Main Content */}
                <div className="flex-1">
                    {/* Video Player Section */}
                    <div className="relative p-8">
                        <div className="relative bg-black aspect-video rounded-3xl">
                            <Card className="flex-1">
                                {videos.length > 0 && videos[0].id.videoId && (
                                    <iframe
                                        className="rounded-lg"
                                        title="YouTube Video"
                                        width="100%"
                                        height="730px"
                                        src={
                                            dubbedVideo ||
                                            `https://www.youtube.com/embed/${videos[0].id.videoId}`
                                        }
                                        allowFullScreen
                                    ></iframe>
                                )}
                            </Card>
                        </div>

                        {/* Course Navigation */}
                        <div className="mt-8">
                            <Card className="rounded-3xl shadow-xl bg-white">
                                <div className="flex items-center justify-between py-6 px-8">
                                    <h1 className="text-2xl font-bold text-purple-800">{title}</h1>
                                    <div className="flex items-center gap-4">
                                        <Progress value={33} className="w-32 bg-purple-200" />
                                        <Button variant="ghost" size="icon" className="text-purple-600 hover:text-purple-800 hover:bg-purple-100">
                                            <Share2 className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>

                                <Tabs defaultValue="overview" className="w-full">
                                    <TabsList className="bg-purple-50 border-b rounded-none h-12 w-full justify-start px-6">
                                        <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:text-purple-800 data-[state=active]:border-b-2 data-[state=active]:border-purple-600">
                                            Overview
                                        </TabsTrigger>
                                        <TabsTrigger value="q&a" className="data-[state=active]:bg-white data-[state=active]:text-purple-800 data-[state=active]:border-b-2 data-[state=active]:border-purple-600">
                                            Q&A
                                        </TabsTrigger>
                                        <TabsTrigger value="notes" className="data-[state=active]:bg-white data-[state=active]:text-purple-800 data-[state=active]:border-b-2 data-[state=active]:border-purple-600">
                                            Notes
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="overview" className="p-8">
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-6">
                                                <div className="flex items-center text-purple-800">
                                                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                                                    <span className="ml-1 font-semibold">4.7</span>
                                                    <span className="ml-1 text-purple-600">(412 reviews)</span>
                                                </div>
                                                <div className="flex items-center text-purple-600">
                                                    <Users className="w-5 h-5" />
                                                    <span className="ml-1">1,371 students</span>
                                                </div>
                                                <div className="flex items-center text-purple-600">
                                                    <Clock className="w-5 h-5" />
                                                    <span className="ml-1">61.5 minutes</span>
                                                </div>
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-purple-800 mb-4">Summary</h2>
                                                <p className="text-purple-700">{videoSummary || "No summary available."}</p>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="q&a" className="p-8">
                                        <div className="space-y-4">
                                            {Object.values(ques).map((question: any) => (
                                                <Card key={question.id} className="p-6 rounded-2xl border-purple-200 bg-white shadow-lg">
                                                    <h3 className="text-lg font-bold text-purple-800">{question.question}</h3>
                                                    <div className="mt-4 space-y-3">
                                                        {question.answer.map((option: any, index: any) => {
                                                            const isSelected = selectedAnswers[question.id] === option;
                                                            const isCorrect = isSelected && option === question.correctAns;
                                                            return (
                                                                <div
                                                                    key={index}
                                                                    className={`flex items-center space-x-2 p-3 rounded-xl hover:bg-purple-50 cursor-pointer transition-all
                                                                        ${isLocked[question.id] ? "pointer-events-none" : ""}
                                                                        ${isSelected && isCorrect ? "bg-green-50" : ""}
                                                                        ${isSelected && !isCorrect ? "bg-red-50" : ""}`}
                                                                    onClick={() => handleAnswerSelection(question.id, option)}
                                                                >
                                                                    {isSelected ? (
                                                                        isCorrect ? (
                                                                            <Check className="text-green-500" size={18} />
                                                                        ) : (
                                                                            <X className="text-red-500" size={18} />
                                                                        )
                                                                    ) : (
                                                                        <Square className="text-purple-400" size={18} />
                                                                    )}
                                                                    <span className={`${isSelected && isCorrect ? "text-green-600" : isSelected ? "text-red-600" : "text-purple-700"} font-medium`}>
                                                                        {option}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </Card>
                        </div>
                    </div>
                </div>

                {/* Course Content Sidebar */}
                <div className="lg:w-[400px] bg-white shadow-xl">
                    <div className="p-6 border-b border-purple-100">
                        <h2 className="text-2xl font-bold text-purple-800">Course Content</h2>
                        <p className="text-purple-600 mt-1">{title}</p>
                    </div>
                    <ScrollArea className="h-[calc(100vh-100px)]">
                        <Accordion type="single" collapsible className="w-full">
                            {course.map((section: any, index: number) => (
                                <AccordionItem key={index} value={`section-${index}`}>
                                    <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-purple-50 text-purple-800">
                                        <div className="flex flex-col items-start">
                                            <div className="font-semibold">{section.title}</div>
                                            <div className="text-sm text-purple-600">
                                                {section.subtopics.reduce(
                                                    (count: number, subtopic: { completed: boolean }) =>
                                                        subtopic.completed ? count + 1 : count,
                                                    0
                                                )}
                                                /{section.subtopics.length} | 37 mins
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="bg-purple-50">
                                        <div className="space-y-1 p-2">
                                            {section.subtopics.map((lecture: any, lectureIndex: number) => (
                                                <button
                                                    key={lectureIndex}
                                                    className="w-full px-4 py-3 text-left hover:bg-white rounded-xl flex items-center gap-3 transition-all"
                                                    onClick={() => {
                                                        handleSubtopicClick(lecture.id, lectureIndex + 1, lecture);
                                                        handleSearch(lecture);
                                                        setSelectedTitle(lecture.title);
                                                        setCourse((prevCourse: any) =>
                                                            prevCourse.map((topic: any) => ({
                                                                ...topic,
                                                                subtopics: topic.subtopics.map((subtopic: any) =>
                                                                    subtopic.id === lecture.id
                                                                        ? { ...subtopic, completed: true }
                                                                        : subtopic
                                                                ),
                                                            }))
                                                        );
                                                    }}
                                                >
                                                    <Play className="w-4 h-4 flex-shrink-0 text-purple-600" />
                                                    <span className="flex-1 text-purple-800">{lecture.title}</span>
                                                    <span>
                                                        {lecture.completed ? (
                                                            <Check className="text-green-500" size={18} />
                                                        ) : (
                                                            <Square className="text-purple-400" size={18} />
                                                        )}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>

                        <div className="w-full flex justify-center p-8">
                            {course.every((section: any) =>
                                section.subtopics.every((subtopic: any) => subtopic.completed)
                            ) ? (
                                <Button
                                    onClick={() => handleCertify()}
                                    className="px-8 py-6 text-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-lg transition-all"
                                >
                                    Get Your Certificate ✨
                                </Button>
                            ) : (
                                <Button
                                    disabled
                                    className="px-8 py-6 text-xl bg-gray-200 text-gray-500 rounded-xl cursor-not-allowed"
                                >
                                    Complete the course first
                                </Button>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </div>
    );
}