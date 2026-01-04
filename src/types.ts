export interface Task {
  id: number;
  displayId: string;
  name: string;
  status: 'IN_PROGRESS' | 'DONE' | 'COMPLETE';
  parentId: number | null;
}