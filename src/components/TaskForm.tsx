import React, { useState } from 'react';
import type { Task } from '../types';

interface TaskFormProps {
  onCreate: (name: string, parentDisplayId?: string) => void;
  allTasks: Task[];
}

const TaskForm: React.FC<TaskFormProps> = ({ onCreate, allTasks }) => {
  const [name, setName] = useState('');
  const [parentDisplayId, setParentDisplayId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Task name is required!');
      return;
    }
    onCreate(name, parentDisplayId || undefined);
    setName('');
    setParentDisplayId('');
  };

  // Show available parent options
  const parentOptions = allTasks.filter(t => !t.parentId).map(t => t.displayId);

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
      <h2>Create Task</h2>
      <div>
        <label>
          Task Name (required): 
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ marginLeft: '5px', padding: '5px' }}
          />
        </label>
      </div>
      <div>
        <label>
          Parent Task ID (optional, e.g., 1, 1.1): 
          <input
            type="text"
            value={parentDisplayId}
            onChange={(e) => setParentDisplayId(e.target.value)}
            placeholder="e.g., 1 or 1.1"
            style={{ marginLeft: '5px', padding: '5px' }}
          />
        </label>
        <small style={{ color: '#666', display: 'block' }}>
          Available parents: {parentOptions.join(', ') || 'None yet'}
        </small>
      </div>
      <br />
      <button type="submit" style={{ padding: '8px 16px' }}>Create Task</button>
    </form>
  );
};

export default TaskForm;