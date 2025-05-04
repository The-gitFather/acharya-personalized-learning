"use client"
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Whiteboard } from '@/components/Whiteboard';

export default function Home() {
  return (
    <div className="container mx-auto p-4 min-h-screen">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-center mb-2">
          AI-Powered Whiteboard
        </h1>
        <p className="text-center text-muted-foreground">
          Draw anything and let AI analyze it
        </p>
      </header>

      <ErrorBoundary>
        <Whiteboard />
      </ErrorBoundary>
    </div>
  );
}