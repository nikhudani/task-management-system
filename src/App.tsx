// src/App.tsx
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

    let updatedTasks = [...tasks, newTask];
    if (targetParentId !== null) {
      updatedTasks = downgradeParents(updatedTasks, targetParentId);
    }

    setTasks(updatedTasks);
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
    setTasks(prevTasks => {
      const newTasks = [...prevTasks];
      const index = newTasks.findIndex(t => t.id === id);
      if (index === -1) return newTasks;

      const task = {...newTasks[index]};

      if (task.status === 'IN_PROGRESS') {
        // Toggle to DONE, then upgrade if possible
        task.status = 'DONE';
        newTasks[index] = task;
        return upgradeAndPropagate(newTasks, id);
      } else {
        // Toggle to IN_PROGRESS, then downgrade parents
        task.status = 'IN_PROGRESS';
        newTasks[index] = task;
        return downgradeParents(newTasks, task.parentId);
      }
    });
  };

  // Upgrade a task from DONE to COMPLETE if all children are COMPLETE, and propagate up
  const upgradeAndPropagate = (tasksList: Task[], id: number): Task[] => {
    const newTasks = [...tasksList];
    const index = newTasks.findIndex(t => t.id === id);
    if (index === -1) return newTasks;

    const task = newTasks[index];
    if (task.status !== 'DONE') return newTasks;

    const children = newTasks.filter(t => t.parentId === task.id);
    const allChildrenComplete = children.length === 0 || children.every(c => c.status === 'COMPLETE');

    if (allChildrenComplete) {
      task.status = 'COMPLETE';
      newTasks[index] = task;

      if (task.parentId !== null) {
        return upgradeAndPropagate(newTasks, task.parentId);
      }
    }

    return newTasks;
  };

  // Downgrade parents from COMPLETE to DONE if applicable, propagate up
  const downgradeParents = (tasksList: Task[], parentId: number | null): Task[] => {
    if (parentId === null) return tasksList;

    const newTasks = [...tasksList];
    const index = newTasks.findIndex(t => t.id === parentId);
    if (index === -1) return newTasks;

    const parent = newTasks[index];
    if (parent.status === 'COMPLETE') {
      parent.status = 'DONE';
      newTasks[index] = parent;

      return downgradeParents(newTasks, parent.parentId);
    }

    return newTasks;
  };

     const handleEditTask = (id: number, updates: { name?: string; parentDisplayId?: string | null }) => {
    setTasks(prevTasks => {
      let newTasks = [...prevTasks];
      const index = newTasks.findIndex(t => t.id === id);
      if (index === -1) return newTasks;

      const task = { ...newTasks[index] };
      let parentChanged = false;
      const oldParentId = task.parentId;
      let newParentId: number | null = oldParentId;

      // Update name if provided
      if (updates.name !== undefined) {
        task.name = updates.name.trim() || task.name;
      }

      // Only process parent change if explicitly provided and different
      if (updates.parentDisplayId !== undefined) {
        const newParentStr = updates.parentDisplayId === null ? null : updates.parentDisplayId.trim();

        if (newParentStr === null) {
          if (task.parentId !== null) parentChanged = true;
          newParentId = null;
        } else {
          const parentTask = newTasks.find(t => t.displayId === newParentStr);
          if (!parentTask) {
            alert(`Parent Task ID "${newParentStr}" does not exist!`);
            return prevTasks;
          }
          if (parentTask.id === task.id) {
            alert("A task cannot be its own parent!");
            return prevTasks;
          }
          // Basic cycle prevention
          if (isDescendant(parentTask.id, task.id, newTasks)) {
            alert("Cannot create circular dependency!");
            return prevTasks;
          }
          if (task.parentId !== parentTask.id) parentChanged = true;
          newParentId = parentTask.id;
        }
        task.parentId = newParentId;
      }

      newTasks[index] = task;

      // ONLY update displayIds if parent actually changed
      if (parentChanged) {
        // Update this task's displayId
        const newDisplayId = newParentId === null 
          ? generateTopLevelDisplayId(newTasks) 
          : `${newTasks.find(t => t.id === newParentId)!.displayId}.${getNextChildNumber(newTasks, newParentId)}`;
        task.displayId = newDisplayId;
        newTasks[index] = task;

        // Recursively update all descendants
        updateDescendantDisplayIds(newTasks, task.id, newDisplayId);
      }

      // Trigger status propagation only if parent changed
      if (parentChanged) {
        if (oldParentId !== null) {
          newTasks = downgradeParents(newTasks, oldParentId);
        }
        if (newParentId !== null) {
          newTasks = downgradeParents(newTasks, newParentId);
        }
        newTasks = upgradeAndPropagate(newTasks, id);
      }

      return newTasks;
    });
  };

  // Helper: Check if target is descendant of task (for cycle prevention)
  const isDescendant = (potentialAncestorId: number, taskId: number, tasksList: Task[]): boolean => {
    const children = tasksList.filter(t => t.parentId === potentialAncestorId);
    return children.some(child => 
      child.id === taskId || isDescendant(child.id, taskId, tasksList)
    );
  };

  // Helper: Generate next top-level ID (e.g., 1,2,3...)
  const generateTopLevelDisplayId = (tasksList: Task[]): string => {
    const topLevel = tasksList.filter(t => t.parentId === null);
    const max = topLevel.reduce((max, t) => Math.max(max, parseInt(t.displayId) || 0), 0);
    return (max + 1).toString();
  };

  // Helper: Get next child number for a parent
  const getNextChildNumber = (tasksList: Task[], parentId: number): number => {
    const siblings = tasksList.filter(t => t.parentId === parentId);
    return siblings.length + 1; // since we're adding a new one (moved)
  };

  // Helper: Recursively update descendants' displayIds
  const updateDescendantDisplayIds = (tasksList: Task[], parentId: number, newParentDisplayId: string) => {
    const children = tasksList.filter(t => t.parentId === parentId);
    children.forEach((child, idx) => {
      const childIndex = tasksList.findIndex(t => t.id === child.id);
      const childDisplayId = `${newParentDisplayId}.${idx + 1}`;
      tasksList[childIndex].displayId = childDisplayId;
      updateDescendantDisplayIds(tasksList, child.id, childDisplayId);
    });
  };

  return (
    <div className="App">
      <h1>CheckPointSpot Tasking System</h1>
      <TaskForm onCreate={handleCreate} allTasks={tasks} />
      <TaskList 
  tasks={tasks} 
  onToggleStatus={handleToggleStatus}
  onEditTask={handleEditTask}
/>
    </div>
  );
};

export default App;