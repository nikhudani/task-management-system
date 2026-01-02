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

  // Get top-level tasks (no parent)
  const topLevelTasks = tasks.filter(task => task.parentId === null);

  // Build hierarchy recursively
  const buildHierarchy = (parentId: number | null, level: number = 0): Task[] => {
    return tasks
      .filter(task => task.parentId === parentId)
      .sort((a, b) => a.displayId.localeCompare(b.displayId))
      .flatMap(task => {
        const children = buildHierarchy(task.id, level + 1);
        return [task, ...children];
      });
  };

  const allHierarchicalTasks = topLevelTasks.flatMap(task => buildHierarchy(task.id));

  // Filter logic
  const filteredTasks = allHierarchicalTasks.filter((task) => {
    if (filter === 'ALL') return true;
    if (filter === 'IN_PROGRESS') return task.status === 'IN_PROGRESS';
    if (filter === 'DONE') return task.status === 'DONE';
    if (filter === 'COMPLETE') return isComplete(task, tasks);
    return true;
  });

  const toggleExpand = (id: number) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpanded(newExpanded);
  };

  const hasChildren = (taskId: number) => tasks.some(t => t.parentId === taskId);

  const getIndentStyle = (level: number): React.CSSProperties => ({
    paddingLeft: `${level * 30 + 10}px`,
    position: 'relative'
  });

  const getDisplayStatus = (task: Task) => 
    isComplete(task, tasks) ? 'COMPLETE' : task.status;

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
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>ID</th>
            <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Name</th>
            <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>Status</th>
            <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredTasks.map((task) => {
            const level = task.displayId.split('.').length - 1;
            const isExpanded = expanded.has(task.id);

            return (
              <React.Fragment key={task.id}>
                <tr style={{ backgroundColor: level % 2 ? '#f9f9f9' : 'white' }}>
                  <td style={{ border: '1px solid #ddd', padding: '8px', ...getIndentStyle(level) }}>
                    {hasChildren(task.id) && (
                      <span 
                        style={{ cursor: 'pointer', marginRight: '8px', fontWeight: 'bold' }}
                        onClick={() => toggleExpand(task.id)}
                      >
                        {isExpanded ? '▼' : '▶'}
                      </span>
                    )}
                    <strong>{task.displayId}</strong>
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', ...getIndentStyle(level) }}>
                    {task.name}
                  </td>
                  <td style={{ 
                    border: '1px solid #ddd', 
                    padding: '8px', 
                    textAlign: 'center',
                    fontWeight: getDisplayStatus(task) === 'COMPLETE' ? 'bold' : 'normal',
                    color: getDisplayStatus(task) === 'COMPLETE' ? 'green' : 'inherit'
                  }}>
                    {getDisplayStatus(task)}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={task.status === 'DONE'}
                      onChange={() => onToggleStatus(task.id)}
                      style={{ transform: 'scale(1.2)' }}
                    />
                  </td>
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
      
      {filteredTasks.length === 0 && (
        <p style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>
          No tasks match the selected filter.
        </p>
      )}
    </div>
  );
};

export default TaskList;