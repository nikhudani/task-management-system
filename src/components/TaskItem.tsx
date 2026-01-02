import { useContext } from 'react';
import TaskContext from '../context/TaskContext';
import type { Task } from '../models/Task';

export default function TaskItem({ task }: { task: Task }) {
  const context = useContext(TaskContext);
  if (!context) return null;

  const { tasks, dispatch } = context;

  const children = tasks.filter(t => t.parentId === task.id);

  return (
    <li>
      <input
        type="checkbox"
        checked={task.status === 'DONE' || task.status === 'COMPLETE'}
        onChange={() => dispatch({ type: 'TOGGLE_TASK', id: task.id })}
        />
        {task.name} — {task.status}

      {children.length > 0 && (
        <ul style={{ marginLeft: '20px' }}>
          {children.map(child => (
            <TaskItem key={child.id} task={child} />
          ))}
        </ul>
      )}
    </li>
  );
}
