"use client";
import { KanbanBoard } from "@/components/Kanban/kanban-board";
import React from "react";

const page = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b bg-gray-100 ">
      <KanbanBoard />
    </div>
  );
};

export default page;
