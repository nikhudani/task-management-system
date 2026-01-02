import React, { useState } from 'react';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import type{ Task } from './types';
import './App.css';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [nextId, setNextId] = useState(1);

  // Generate displayId like 1, 1.1, 1.1.1 based on parent
  const generateDisplayId = (parentDisplayId?: string): string => {
    if (!parentDisplayId) {
      // New top-level task
      const topLevelCount = tasks.filter(t => !t.parentId).length;
      return (topLevelCount + 1).toString();
    }
    
    // Find parent task
    const parentTask = tasks.find(t => t.displayId === parentDisplayId);
    if (!parentTask) return 'ERROR';
    
    // Count existing children of this parent
    const childCount = tasks.filter(t => t.parentId === parentTask.id).length;
    return `${parentDisplayId}.${childCount + 1}`;
  };

  // Find task by displayId
  const findTaskByDisplayId = (displayId: string): Task | null => {
    return tasks.find(t => t.displayId === displayId) || null;
  };

  const handleCreate = (name: string, parentDisplayId?: string) => {
    let targetParentId: number | null = null;

    if (parentDisplayId) {
      const parentTask = findTaskByDisplayId(parentDisplayId);
      if (!parentTask) {
        alert(`Parent Task ID "${parentDisplayId}" does not exist!`);
        return;
      }
      targetParentId = parentTask.id;
      
      // Check for circular dependency
      if (hasCycle(targetParentId, new Set())) {
        alert('Circular dependency detected!');
        return;
      }
    }

    const displayId = generateDisplayId(parentDisplayId);
    const newTask: Task = {
      id: nextId,
      displayId,
      name,
      status: 'IN_PROGRESS',
      parentId: targetParentId,
    };

    setTasks([...tasks, newTask]);
    setNextId(nextId + 1);
  };

  const hasCycle = (taskId: number, visiting: Set<number>): boolean => {
    if (visiting.has(taskId)) return true;
    visiting.add(taskId);
    
    const task = tasks.find(t => t.id === taskId);
    if (task && task.parentId) {
      return hasCycle(task.parentId, visiting);
    }
    return false;
  };

  const handleToggleStatus = (id: number) => {
    setTasks(
      tasks.map((task) =>
        task.id === id
          ? { ...task, status: task.status === 'IN_PROGRESS' ? 'DONE' : 'IN_PROGRESS' }
          : task
      )
    );
  };

  return (
    <div className="App">
      <h1>CheckPointSpot Tasking System</h1>
      <TaskForm onCreate={handleCreate} allTasks={tasks} />
      <TaskList tasks={tasks} onToggleStatus={handleToggleStatus} />
    </div>
  );
};

export default App;