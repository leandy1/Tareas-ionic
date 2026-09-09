
export interface PendingRecord {
  id: string;            
  createdAt: number;     
  synced: boolean;        
  payload: unknown;      
}
