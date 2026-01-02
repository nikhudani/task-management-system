import React, { useState } from 'react';
import type{ Task } from '../types';

const ITEMS_PER_PAGE = 20;

interface TaskListProps {
  tasks: Task[];
  onToggleStatus: (id: number) => void;
  onEditTask: (id: number, updates: { name?: string; parentDisplayId?: string | null }) => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, onToggleStatus, onEditTask }) => {
  const [filter, setFilter] = useState<'ALL' | 'IN_PROGRESS' | 'DONE' | 'COMPLETE'>('ALL');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editParentDisplayId, setEditParentDisplayId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // FIXED: Proper numeric sorting for displayIds like 1, 2, 10, 11, 1.1, 1.10
  const parseDisplayId = (displayId: string): number[] => {
    return displayId.split('.').map(part => parseInt(part, 10));
  };

  const compareDisplayIds = (a: string, b: string): number => {
    const partsA = parseDisplayId(a);
    const partsB = parseDisplayId(b);
    
    const minLength = Math.min(partsA.length, partsB.length);
    for (let i = 0; i < minLength; i++) {
      if (partsA[i] !== partsB[i]) {
        return partsA[i] - partsB[i];
      }
    }
    return partsA.length - partsB.length;
  };

  const buildHierarchy = (task: Task): Task[] => {
    const children = tasks
      .filter(t => t.parentId === task.id)
      .sort((a, b) => compareDisplayIds(a.displayId, b.displayId));
    const subTrees = children.flatMap(child => buildHierarchy(child));
    return [task, ...subTrees];
  };

  const allHierarchicalTasks = tasks
    .filter(task => task.parentId === null)
    .sort((a, b) => compareDisplayIds(a.displayId, b.displayId))
    .flatMap(root => buildHierarchy(root));

  const filteredTasks = allHierarchicalTasks.filter(task => {
    if (filter === 'ALL') return true;
    return task.status === filter;
  });

  const isVisible = (task: Task): boolean => {
    if (task.parentId === null) return true;
    const parent = tasks.find(t => t.id === task.parentId);
    if (!parent || !expanded.has(parent.id)) return false;
    return isVisible(parent);
  };

  const visibleTasks = filteredTasks.filter(isVisible);

  const totalPages = Math.ceil(visibleTasks.length / ITEMS_PER_PAGE);
  const paginatedTasks = visibleTasks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const toggleExpand = (id: number) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpanded(newExpanded);
    setCurrentPage(1);
  };

  const hasChildren = (taskId: number) => tasks.some(t => t.parentId === taskId);

  const getIndentStyle = (level: number) => ({
    paddingLeft: `${level * 30 + 10}px`,
  });

  const getDependencyStats = (task: Task) => {
    const directChildren = tasks.filter(t => t.parentId === task.id);
    const total = directChildren.length;
    const done = directChildren.filter(c => c.status !== 'IN_PROGRESS').length;
    const complete = directChildren.filter(c => c.status === 'COMPLETE').length;
    return { total, done, complete };
  };

  const getDisplayStatus = (task: Task) => {
    const hasDeps = hasChildren(task.id);
    const color = task.status === 'COMPLETE' ? '#27ae60' : task.status === 'DONE' ? '#e67e22' : '#7f8c8d';

    if (!hasDeps) return <strong style={{ color }}>{task.status}</strong>;

    const { total, done, complete } = getDependencyStats(task);
    return (
      <div style={{ textAlign: 'center', lineHeight: '1.4' }}>
        <strong style={{ color }}>{task.status}</strong>
        <br />
        <small style={{ color: '#555', fontSize: '12px' }}>
          Dependencies: {done}/{total} done, {complete}/{total} complete
        </small>
      </div>
    );
  };

  const startEditing = (task: Task) => {
    setEditingId(task.id);
    setEditName(task.name);
    const parent = tasks.find(t => t.id === task.parentId);
    setEditParentDisplayId(parent?.displayId || '');
  };

  const saveEdit = (task: Task) => {
    const newParent = editParentDisplayId.trim() || null;
    if (newParent) {
      const parentTask = tasks.find(t => t.displayId === newParent);
      if (!parentTask) return alert(`Parent "${newParent}" not found!`);
      if (parentTask.id === task.id) return alert("Task cannot be its own parent!");
    }
    onEditTask(task.id, { name: editName.trim() || task.name, parentDisplayId: newParent });
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditParentDisplayId('');
  };

  return (
    <div>
      <h2>Task List</h2>
      <div style={{ marginBottom: '15px' }}>
        <label>
          Filter by Status:
          <select
            value={filter}
            onChange={(e) => { setFilter(e.target.value as any); setCurrentPage(1); }}
            style={{ marginLeft: '10px', padding: '8px' }}
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
            <th style={{ padding: '12px', textAlign: 'left', color: 'white', border: '1px solid #ddd' }}>ID</th>
            <th style={{ padding: '12px', textAlign: 'left', color: 'white', border: '1px solid #ddd' }}>Name</th>
            <th style={{ padding: '12px', textAlign: 'center', color: 'white', border: '1px solid #ddd' }}>Status</th>
            <th style={{ padding: '12px', textAlign: 'center', color: 'white', border: '1px solid #ddd' }}>Action</th>
            <th style={{ padding: '12px', textAlign: 'center', color: 'white', border: '1px solid #ddd' }}>Edit</th>
          </tr>
        </thead>
        <tbody>
          {paginatedTasks.map(task => {
            const level = task.displayId.split('.').length - 1;
            const isEditing = editingId === task.id;

            return (
              <tr key={task.id} style={{ backgroundColor: level % 2 ? '#f9f9f9' : 'white' }}>
                <td style={{ padding: '8px', ...getIndentStyle(level), display: 'flex', alignItems: 'center', border: '1px solid #ddd' }}>
                  {hasChildren(task.id) && (
                    <span
                      onClick={() => toggleExpand(task.id)}
                      style={{ cursor: 'pointer', marginRight: '12px', fontWeight: 'bold', fontSize: '16px', userSelect: 'none' }}
                    >
                      {expanded.has(task.id) ? '▼' : '▶'}
                    </span>
                  )}
                  <strong>{task.displayId}</strong>
                </td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                  {isEditing ? (
                    <input 
                      value={editName} 
                      onChange={e => setEditName(e.target.value)} 
                      style={{ width: '90%', padding: '6px' }} 
                      autoFocus 
                    />
                  ) : task.name}
                </td>
                <td style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd' }}>
                  {getDisplayStatus(task)}
                </td>
                <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>
                  <input
                    type="checkbox"
                    checked={task.status !== 'IN_PROGRESS'}
                    onChange={() => onToggleStatus(task.id)}
                    style={{ transform: 'scale(1.3)', cursor: 'pointer' }}
                  />
                </td>
                <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>
                  {isEditing ? (
                    <>
                      <button 
                        onClick={() => saveEdit(task)} 
                        style={{ background: '#27ae60', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px', marginRight: '5px', cursor: 'pointer' }}
                      >
                        Save
                      </button>
                      <button 
                        onClick={cancelEdit} 
                        style={{ background: '#e74c3c', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                      <div style={{ marginTop: '8px' }}>
                        <small>Parent ID:</small><br />
                        <input
                          type="text"
                          value={editParentDisplayId}
                          onChange={e => setEditParentDisplayId(e.target.value)}
                          placeholder="empty = top-level"
                          style={{ width: '80%', padding: '4px', marginTop: '4px' }}
                        />
                      </div>
                    </>
                  ) : (
                    <button 
                      onClick={() => startEditing(task)} 
                      style={{ background: '#3498db', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {visibleTasks.length === 0 && (
        <p style={{ textAlign: 'center', margin: '30px', color: '#666', fontStyle: 'italic' }}>No tasks found.</p>
      )}

      {totalPages > 1 && (
        <div style={{ marginTop: '30px', textAlign: 'center' }}>
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            style={{
              padding: '10px 20px',
              margin: '0 10px',
              background: currentPage === 1 ? '#ccc' : '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            Previous
          </button>
          <span style={{ fontSize: '16px', margin: '0 20px' }}>
            Page {currentPage} of {totalPages} ({visibleTasks.length} tasks)
          </span>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={{
              padding: '10px 20px',
              margin: '0 10px',
              background: currentPage === totalPages ? '#ccc' : '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskList;