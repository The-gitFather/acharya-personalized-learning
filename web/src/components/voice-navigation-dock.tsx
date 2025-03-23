"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, X } from "lucide-react";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { useRouter } from "next/navigation";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey!);

// console.log(apiKey)


const speechSchema = {
  type: SchemaType.OBJECT,
  properties: {
    analysis: {
      type: SchemaType.STRING,
      description:
        "just the exact command that was interpreted by the model from the provided possible commands",
      nullable: false,
    },
    explanation: {
      type: SchemaType.STRING,
      description:
        "A single line that the voice navigator can speak to the user",
      nullable: false,
    },
  },
  required: ["analysis", "explanation"],
};

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: speechSchema,
  },
});

export function VoiceNavigationDockComponent() {
  const [isDockOpen, setIsDockOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (
        "SpeechRecognition" in window ||
        "webkitSpeechRecognition" in window
      ) {
        const SpeechRecognition =
          window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event: any) => {
          const current = event.resultIndex;
          const transcriptText = event.results[current][0].transcript;
          setTranscript(transcriptText);
        };
      }

      if ("speechSynthesis" in window) {
        synthRef.current = window.speechSynthesis;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleDock = () => {
    setIsDockOpen(!isDockOpen);
    if (!isDockOpen) {
      setFeedback("Voice navigation activated. How can I help you?");
      speak("Voice navigation activated. How can I help you?");
    } else {
      stopListening();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
      setIsListening(true);
      setFeedback("Listening...");
    } else {
      setFeedback("Speech recognition is not supported in your browser.");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      handleVoiceCommand(transcript);
      // setFeedback("Listening stopped.");
    }
  };

  const speak = (text: string) => {
    if (synthRef.current) {
      const utterance = new SpeechSynthesisUtterance(text);
      synthRef.current.speak(utterance);
    }
  };

  const generateCommand = async (command: string) => {
    const lowerCommand = command.toLowerCase().trim();

    // Define the possible paths and their associated keywords
    const possiblePaths = {
      "home": "/",
      "courses main page": "/courses",
      "dashboard": "/dashboard",
      "doubt solving main page": "/doubts",
      "kanban board": "/kanban",
      "study material, books, pdf": "/study-material",
      "AI courses": "/courses/ai-course",
      "hybrid courses": "/courses/hybrid-course",
      "online courses": "/courses/online-course",
      "doubt solving from image": "/doubts/analyze-image/",
      "doubt solving using whiteboard": "/doubts/analyze-whiteboard",
      "aoubt solving one on one ai avatar": "/doubts/avatar",

      "scroll down": "scroll-down",
      "scroll up": "scroll-up"
    };

    // Prepare the prompt for the Generative AI model
    const prompt = `
      Interpret the following voice command and return the most relevant path from the list below:
      Command: "${lowerCommand}"
      Possible paths: ${JSON.stringify(possiblePaths)}

      return json data with the following keys:
      {
        "analysis": "just the exact command that was interpreted by the model from the provided possible commands",
        "explanation": "A single line that the voice navigator can speak to the user"
      }
    `;

    try {

      // Generate content using the model
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      let parsedResponse = JSON.parse(
        text
      );
      console.log("Parsed response:", parsedResponse);

      const interpretedCommand = parsedResponse.analysis.toLowerCase();
      const explanation = parsedResponse.explanation.toLowerCase();

      // Map the interpreted command to the corresponding path
      const path = possiblePaths[interpretedCommand] || null;

      return { path, explanation };
    } catch (error) {
      console.error("Error interpreting command:", error);
      return null; // Return null if there's an error
    }
  };

  const handleVoiceCommand = async (command: string) => {
    try {
      const { path, explanation }: any = await generateCommand(command);

      if (explanation) speak(explanation)

      console.log("path", path)

      if (path) {
        if (path === "scroll-down") {
          window.scrollBy(0, 500);
          setFeedback("Scrolling down");
        } else if (path === "scroll-up") {
          window.scrollBy(0, -300);
          setFeedback("Scrolling up");
        } else {
          navigateTo(path);
        }
      } else {
        setFeedback(`I heard: ${command}. This is not a recognized command.`);
        // speak(`I heard: ${command}. This is not a recognized command.`)
      }
    } catch (error) {
      console.error("Error processing voice command:", error);
      setFeedback("Sorry, I couldn't process that command.");
      // speak("Sorry, I couldn't process that command.")
    }
  };

  const navigateTo = (path: string) => {
    router.push(path);
    setFeedback(`Navigating to ${path}`);
  };

  return (
    <Popover open={isDockOpen} onOpenChange={toggleDock}>
      {/* Trigger Button */}
      <PopoverTrigger asChild>
        <Button
          className="fixed bottom-[100px] right-6 w-[60px] h-[60px] rounded-full p-2 z-[100] hover:scale-[1.05]"
          aria-label={isDockOpen ? "Close voice navigation" : "Open voice navigation"}
        >
          {isDockOpen ? (
            <X className="w-8 h-8" />
          ) : (
            <Mic className="w-8 h-8" />
          )}
        </Button>
      </PopoverTrigger>

      {/* Popover Content */}
      <PopoverContent
        className="w-[350px] bg-background border border-border rounded-lg shadow-lg z-[1000]"
        align="end"
        side="top"
      >
        <div className="p-4">
          <h2 className="text-2xl font-bold mb-4">Voice Navigation</h2>
          <div className="flex items-center justify-between mb-4">
            <Button onClick={toggleListening}>
              {isListening ? (
                <MicOff className="mr-2 h-4 w-4" />
              ) : (
                <Mic className="mr-2 h-4 w-4" />
              )}
              {isListening ? "Stop Listening" : "Start Listening"}
            </Button>
            <span className="text-sm text-muted-foreground">
              {isListening ? "Listening..." : "Click to start"}
            </span>
          </div>
          <div className="bg-muted p-4 rounded-md mb-4 min-h-[100px]">
            <p className="font-semibold">Transcript:</p>
            <p>{transcript}</p>
          </div>
          <div className="bg-muted p-4 rounded-md">
            <p className="font-semibold">System Feedback:</p>
            <p>{feedback}</p>
          </div>

        </div>
      </PopoverContent>
    </Popover>
  );
};
