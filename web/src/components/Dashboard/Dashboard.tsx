'use client'
import { TodoList } from "./TodoList"
import { TimeTable } from "./TimeTable"
import { Suggestions } from "./Suggestions"
import { WeeklySchedule } from "./WeeklySchedule"
import { useEffect, useState } from "react"
import SimpleCalendar from "./Calendar"

export default function Dashboard() {
  const [schedule, setSchedule] = useState([]);

  useEffect(() => {
    console.log("Schedule updated in Dashboard:", schedule);
  }, [schedule]);

  return (
    <div className="flex h-screen bg-gray-100 p-8">
      <div className="flex-1 overflow-auto ">
        {/* <UserProfile /> */}
        <div className="grid grid-cols-1 lg:grid-cols-[80%_20%] gap-3 mb-8 ">
          <TimeTable />
          <TodoList />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-3 ">
          <SimpleCalendar schedule={schedule} />
          <div className="space-y-8">
            <WeeklySchedule setSchedule={setSchedule} />
            <Suggestions />
          </div>
        </div>
      </div>
    </div>
  )
}