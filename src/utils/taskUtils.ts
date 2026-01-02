import type { Task } from '../models/Task';

/**
 * Determines if a task can be marked COMPLETE
 * A task is COMPLETE if:
 * 1. Its status is DONE
 * 2. All of its children (dependencies) are COMPLETE
 */
export function isTaskComplete(task: Task, allTasks: Task[]): boolean {
  if (task.status !== 'DONE') return false;

  const children = allTasks.filter(t => t.parentId === task.id);
  return children.every(child => isTaskComplete(child, allTasks));
}
