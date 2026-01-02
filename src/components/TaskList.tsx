import React, { useState } from 'react';
import type{ Task } from '../types';

const isComplete = (task: Task, allTasks: Task[]): boolean => {
  if (task.status !== 'DONE') return false;
  const children = allTasks.filter((t) => t.parentId === task.id);
  if (children.length === 0) return true;
  return children.every((child) => isComplete(child, allTasks));
};

interface TaskListProps {
  tasks: Task[];
  onToggleStatus: (id: number) => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, onToggleStatus }) => {
  const [filter, setFilter] = useState<'ALL' | 'IN_PROGRESS' | 'DONE' | 'COMPLETE'>('ALL');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  // Build full hierarchy including parents
  const buildHierarchy = (task: Task): Task[] => {
    const children = tasks
      .filter(t => t.parentId === task.id)
      .sort((a, b) => a.displayId.localeCompare(b.displayId));

    const subTrees = children.flatMap(child => buildHierarchy(child));
    return [task, ...subTrees];
  };

  const allHierarchicalTasks = tasks
    .filter(task => task.parentId === null)
    .sort((a, b) => a.displayId.localeCompare(b.displayId))
    .flatMap(root => buildHierarchy(root));

  // Filter tasks
  const filteredTasks = allHierarchicalTasks.filter((task) => {
    if (filter === 'ALL') return true;
    if (filter === 'IN_PROGRESS') return task.status === 'IN_PROGRESS';
    if (filter === 'DONE') return task.status === 'DONE';
    if (filter === 'COMPLETE') return isComplete(task, tasks);
    return true;
  });

  const toggleExpand = (id: number) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpanded(newExpanded);
  };

  const hasChildren = (taskId: number) => tasks.some(t => t.parentId === taskId);

  const getIndentStyle = (level: number) => ({
    paddingLeft: `${level * 30 + 10}px`,
  });

  // Get dependency stats for a task
  const getDependencyStats = (task: Task) => {
    const directChildren = tasks.filter(t => t.parentId === task.id);
    const total = directChildren.length;
    const done = directChildren.filter(c => c.status === 'DONE').length;
    const complete = directChildren.filter(c => isComplete(c, tasks)).length;
    return { total, done, complete };
  };

  const getDisplayStatus = (task: Task) => {
    const baseStatus = isComplete(task, tasks) ? 'COMPLETE' : task.status;
    const hasDeps = hasChildren(task.id);

    if (!hasDeps) return baseStatus;

    const { total, done, complete } = getDependencyStats(task);
    
    return (
      <div style={{ lineHeight: '1.4' }}>
        <strong>{baseStatus}</strong>
        <br />
        <small style={{ color: '#555', fontSize: '12px' }}>
          Dependencies: {done}/{total} done, {complete}/{total} complete
        </small>
      </div>
    );
  };

  return (
    <div>
      <h2>Task List</h2>
      <div style={{ marginBottom: '15px' }}>
        <label>
          Filter by Status:
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value as any)}
            style={{ marginLeft: '5px', padding: '5px' }}
          >
            <option value="ALL">ALL</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="DONE">DONE</option>
            <option value="COMPLETE">COMPLETE</option>
          </select>
        </label>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
        <thead>
          <tr style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left', color: 'white' }}>ID</th>
            <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left', color: 'white' }}>Name</th>
            <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center', color: 'white' }}>Status</th>
            <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center', color: 'white' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredTasks.map((task) => {
            const level = task.displayId.split('.').length - 1;
            const isExpanded = expanded.has(task.id);

            return (
              <tr key={task.id} style={{ backgroundColor: level % 2 ? '#f9f9f9' : 'white' }}>
                <td style={{ border: '1px solid #ddd', padding: '8px', ...getIndentStyle(level) }}>
                  {hasChildren(task.id) && (
                    <span 
                      style={{ cursor: 'pointer', marginRight: '8px', fontWeight: 'bold', userSelect: 'none' }}
                      onClick={() => toggleExpand(task.id)}
                    >
                      {isExpanded ? '▼' : '▶'}
                    </span>
                  )}
                  <strong>{task.displayId}</strong>
                </td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  {task.name}
                </td>
                <td style={{ 
                  border: '1px solid #ddd', 
                  padding: '12px', 
                  textAlign: 'center',
                  verticalAlign: 'middle'
                }}>
                  {getDisplayStatus(task)}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={task.status === 'DONE'}
                    onChange={() => onToggleStatus(task.id)}
                    style={{ transform: 'scale(1.3)', cursor: 'pointer' }}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {filteredTasks.length === 0 && (
        <p style={{ textAlign: 'center', color: '#666', marginTop: '20px', fontStyle: 'italic' }}>
          No tasks match the selected filter.
        </p>
      )}
    </div>
  );
};

export default TaskList;