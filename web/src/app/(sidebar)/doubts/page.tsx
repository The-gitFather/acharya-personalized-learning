"use client";
import DoubtCards from "@/components/DoubtCards";

export default function DoubtHome() {
    return (
        <div className="container min-h-screen flex items-center justify-between gap-8 py-8">
            <div className="flex-1 space-y-6 pl-14">
                <h1 className="text-5xl font-bold tracking-tight">
                    Your Personal
                    <span className="block bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">
                        AI Doubt Assistant
                    </span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-[50ch]">
                    Get instant help with your questions, homework, and academic challenges. Our AI-powered system provides clear, step-by-step solutions.
                </p>
                <div className="flex gap-4">
                    {/* <button className="bg-blue-500 text-white hover:bg-blue-600 px-6 py-3 rounded-lg font-medium">
                        Start Learning
                    </button>
                    <button className="border border-blue-500 text-blue-500 hover:bg-blue-50 px-6 py-3 rounded-lg font-medium">
                        How It Works
                    </button> */}
                </div>
            </div>

            <div className="flex-1 flex justify-center items-center -mt-28">
                <DoubtCards />
            </div>
        </div>
    );
}