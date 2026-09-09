import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { PendingRecord } from '../models/pending-record.model';

const PENDING_KEY = 'pending_records';


@Injectable({
  providedIn: 'root',
})
export class StorageService {

  private _storage: Storage | null = null;
  private ready: Promise<void>;

  constructor(private storage: Storage) {
    this.ready = this.init();
  }

  private async init(): Promise<void> {
   
    this._storage = await this.storage.create();
  }

  /** Guarda un nuevo registro pendiente (creado mientras la app estaba offline). */
  public async addPendingRecord(payload: unknown): Promise<PendingRecord> {
    await this.ready;
    const record: PendingRecord = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      synced: false,
      payload,
    };

    const existing = (await this._storage!.get(PENDING_KEY)) as PendingRecord[] | null;
    const updated = existing ? [...existing, record] : [record];
    await this._storage!.set(PENDING_KEY, updated);
    return record;
  }

 
  public async getPendingRecords(): Promise<PendingRecord[]> {
    await this.ready;
    const existing = (await this._storage!.get(PENDING_KEY)) as PendingRecord[] | null;
    return (existing ?? []).filter(r => !r.synced);
  }

  
  public async markAsSynced(id: string): Promise<void> {
    await this.ready;
    const existing = (await this._storage!.get(PENDING_KEY)) as PendingRecord[] | null;
    if (!existing) return;

    const updated = existing.filter(r => r.id !== id); // se elimina de la cola local
    await this._storage!.set(PENDING_KEY, updated);
  }

 
  public async clearAll(): Promise<void> {
    await this.ready;
    await this._storage!.remove(PENDING_KEY);
  }
}
