'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Task {
  id: string;
  title: string;
  dueDate: Date | number | null;
  status: string;
}

interface CalendarSectionProps {
  tasks: Task[];
}

function getTaskDate(task: Task): Date | null {
  if (!task.dueDate) return null;
  if (task.dueDate instanceof Date) return task.dueDate;
  return new Date(task.dueDate);
}

export function CalendarSection({ tasks }: CalendarSectionProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  
  // Get tasks for this month
  const tasksByDay = new Map<number, Task[]>();
  for (const task of tasks) {
    const taskDate = getTaskDate(task);
    if (taskDate) {
      if (taskDate.getFullYear() === year && taskDate.getMonth() === month) {
        const day = taskDate.getDate();
        if (!tasksByDay.has(day)) {
          tasksByDay.set(day, []);
        }
        tasksByDay.get(day)!.push(task);
      }
    }
  }
  
  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }
  
  const isToday = (day: number | null) => {
    if (!day) return false;
    const today = new Date();
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'badge-completed';
      case 'in-progress': return 'badge-sent';
      default: return 'badge-pending';
    }
  };

  return (
    <div className="card p-6 mt-6">
      <h3 className="text-sm font-medium mb-4" style={{ color: '#9B9B8F' }}>
        Calendar - Upcoming Tasks
      </h3>
      
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-2 rounded hover:bg-gray-100"
        >
          <svg className="w-5 h-5" style={{ color: '#9B9B8F' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="font-medium" style={{ color: '#2D2A26' }}>
          {monthNames[month]} {year}
        </span>
        <button
          onClick={nextMonth}
          className="p-2 rounded hover:bg-gray-100"
        >
          <svg className="w-5 h-5" style={{ color: '#9B9B8F' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      {/* Day Headers */}
      <div className="grid grid-cols-7 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-xs py-2" style={{ color: '#9B9B8F' }}>
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          const dayTasks = day ? tasksByDay.get(day) || [] : [];
          const isCurrentDay = isToday(day);
          
          return (
            <div
              key={idx}
              className={`min-h-[80px] p-1 rounded ${
                day ? 'border' : ''
              }`}
              style={{
                borderColor: isCurrentDay ? '#E07A5F' : '#E8E4DD',
                background: isCurrentDay ? 'rgba(224, 122, 95, 0.05)' : 'transparent',
              }}
            >
              {day && (
                <>
                  <div className={`text-xs ${isCurrentDay ? 'font-bold' : ''}`} style={{ 
                    color: isCurrentDay ? '#E07A5F' : '#9B9B8F' 
                  }}>
                    {day}
                  </div>
                  <div className="space-y-1">
                    {dayTasks.slice(0, 2).map(task => (
                      <Link
                        key={task.id}
                        href={`/tasks/${task.id}`}
                        className={`text-xs px-1 py-0.5 rounded truncate block ${getStatusColor(task.status)}`}
                        title={task.title}
                      >
                        {task.title}
                      </Link>
                    ))}
                    {dayTasks.length > 2 && (
                      <div className="text-xs" style={{ color: '#9B9B8F' }}>
                        +{dayTasks.length - 2} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Upcoming Tasks List */}
      {tasks.filter(t => {
        const d = getTaskDate(t);
        return d && d >= new Date();
      }).length > 0 && (
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid #E8E4DD' }}>
          <h4 className="text-xs font-medium mb-2" style={{ color: '#9B9B8F' }}>
            Upcoming Tasks
          </h4>
          <div className="space-y-2">
            {tasks
              .filter(t => {
                const d = getTaskDate(t);
                return d && d >= new Date();
              })
              .sort((a, b) => getTaskDate(a)!.getTime() - getTaskDate(b)!.getTime())
              .slice(0, 5)
              .map(task => (
                <div key={task.id} className="flex items-center justify-between text-sm">
                  <Link href={`/tasks/${task.id}`} style={{ color: '#E07A5F' }}>
                    {task.title}
                  </Link>
                  <span className={`badge text-xs ${getStatusColor(task.status)}`}>
                    {getTaskDate(task) ? getTaskDate(task)!.toLocaleDateString() : '-'}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}