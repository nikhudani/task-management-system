import { createContext, useReducer, useEffect } from 'react';
import { isTaskComplete } from '../utils/taskUtils';
import type { Task, TaskStatus } from '../models/Task';

type Action =
  | { type: 'ADD_TASK'; task: Task }
  | { type: 'TOGGLE_TASK'; id: string };

interface TaskContextType {
  tasks: Task[];
  dispatch: React.Dispatch<Action>;
}

const TaskContext = createContext<TaskContextType | null>(null);

function reducer(state: Task[], action: Action): Task[] {
  switch (action.type) {
    case 'ADD_TASK':
      return [...state, action.task];

    case 'TOGGLE_TASK': {
      const updatedState = state.map(task =>
        task.id === action.id
          ? {
              ...task,
              status:
                task.status === 'IN_PROGRESS'
                  ? ('DONE' as TaskStatus)
                  : ('IN_PROGRESS' as TaskStatus),
            }
          : task
      );

      // After updating task, propagate COMPLETE upward
      return propagateStatus(updatedState);
    }

    default:
      return state;
  }
}

function propagateStatus(tasks: Task[]): Task[] {
  const updatedTasks = tasks.map(t => ({ ...t }));

  for (const task of updatedTasks) {
    const children = updatedTasks.filter(t => t.parentId === task.id);

    if ((task.status as TaskStatus) === 'DONE' && children.length > 0) {
      if (isTaskComplete(task, updatedTasks)) {
        task.status = 'COMPLETE' as TaskStatus;
      } else if ((task.status as TaskStatus) === 'COMPLETE') {
        task.status = 'DONE' as TaskStatus;
      }
    }
  }

  return updatedTasks;
}

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, dispatch] = useReducer(
    reducer,
    [],
    () => JSON.parse(localStorage.getItem('tasks') || '[]')
  );

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  return (
    <TaskContext.Provider value={{ tasks, dispatch }}>
      {children}
    </TaskContext.Provider>
  );
}

export default TaskContext;
