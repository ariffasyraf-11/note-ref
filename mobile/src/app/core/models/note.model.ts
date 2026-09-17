export interface Note {
  uuid: string;
  title: string;
  content: string;
  updatedAt: string;
  deletedAt: string | null;
  syncStatus: 'pending' | 'synced';
}
