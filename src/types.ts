export interface Task {
  id: number;           // Internal unique number (1,2,3...)
  displayId: string;    // Visual ID like "1", "1.1", "1.1.1"
  name: string;
  status: 'IN_PROGRESS' | 'DONE';
  parentId: number | null;
}