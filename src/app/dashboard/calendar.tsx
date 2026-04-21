'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Task {
  id: string;
  title: string;
  dueDate: Date | number | null;
  status: string;
  clientName?: string | null;
}

interface DashboardCalendarProps {
  tasks: Task[];
}

function getTaskDate(task: Task): Date | null {
  if (!task.dueDate) return null;
  if (task.dueDate instanceof Date) return task.dueDate;
  return new Date(task.dueDate);
}

export function DashboardCalendar({ tasks }: DashboardCalendarProps) {
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
  
  const today = new Date();
  const isToday = (day: number | null) => {
    if (!day) return false;
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'badge-completed';
      case 'in-progress': return 'badge-sent';
      default: return 'badge-pending';
    }
  };
  
  // Get upcoming tasks (future and overdue)
  const upcomingTasks = tasks
    .filter(t => {
      const d = getTaskDate(t);
      return d;
    })
    .sort((a, b) => getTaskDate(a)!.getTime() - getTaskDate(b)!.getTime());
  
  const overdueTasks = upcomingTasks.filter(t => getTaskDate(t)! < new Date());
  const futureTasks = upcomingTasks.filter(t => getTaskDate(t)! >= new Date());

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ marginTop: '0' }}>
      {/* Calendar */}
      <div className="lg:col-span-2 card p-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            className="p-2 rounded hover:bg-gray-100"
          >
            <svg className="w-5 h-5" style={{ color: '#9B9B8F' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-lg font-bold" style={{ color: '#2D2A26' }}>
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
            <div key={day} className="text-center text-xs py-2 font-medium" style={{ color: '#9B9B8F' }}>
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
                className={`min-h-[60px] p-1 rounded ${day ? 'border' : ''}`}
                style={{
                  borderColor: isCurrentDay ? '#E07A5F' : '#E8E4DD',
                  background: isCurrentDay ? 'rgba(224, 122, 95, 0.05)' : 'transparent',
                }}
              >
                {day && (
                  <>
                    <div className={isCurrentDay ? "text-xs font-bold" : "text-xs"} style={{ 
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
                        +{dayTasks.length - 2}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="flex gap-4 mt-4 pt-4" style={{ borderTop: '1px solid #E8E4DD' }}>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-red-100"></span>
            <span className="text-xs" style={{ color: '#9B9B8F' }}>Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded" style={{ background: '#3D405B' }}></span>
            <span className="text-xs" style={{ color: '#9B9B8F' }}>In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-green-100"></span>
            <span className="text-xs" style={{ color: '#9B9B8F' }}>Completed</span>
          </div>
        </div>
      </div>
      
      {/* Sidebar - Upcoming Tasks */}
      <div className="space-y-6">
        {/* Overdue */}
        {overdueTasks.length > 0 && (
          <div className="card p-4">
            <h3 className="text-sm font-medium mb-3" style={{ color: '#E07A5F' }}>
              Overdue ({overdueTasks.length})
            </h3>
            <div className="space-y-2">
              {overdueTasks.slice(0, 5).map(task => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="block p-2 rounded text-sm hover:bg-gray-50"
                >
                  <span style={{ color: '#2D2A26' }}>{task.title}</span>
                  <span className="text-xs ml-2" style={{ color: '#E07A5F' }}>
                    {getTaskDate(task)?.toLocaleDateString()}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
        
        {/* Upcoming */}
        <div className="card p-4">
          <h3 className="text-sm font-medium mb-3" style={{ color: '#9B9B8F' }}>
            Upcoming ({futureTasks.length})
          </h3>
          <div className="space-y-2">
            {futureTasks.slice(0, 8).map(task => (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                className="block p-2 rounded text-sm hover:bg-gray-50"
              >
                <span style={{ color: '#2D2A26' }}>{task.title}</span>
                <span className="text-xs ml-2" style={{ color: '#9B9B8F' }}>
                  {getTaskDate(task)?.toLocaleDateString()}
                </span>
              </Link>
            ))}
            {futureTasks.length === 0 && overdueTasks.length === 0 && (
              <p className="text-sm" style={{ color: '#9B9B8F' }}>No tasks with due dates</p>
            )}
          </div>
        </div>
        
        {/* View All */}
        <Link href="/tasks" className="block text-center text-sm py-2 rounded-lg" style={{ color: '#E07A5F', background: 'rgba(224, 122, 95, 0.1)' }}>
          View All Tasks →
        </Link>
      </div>
    </div>
  );
}