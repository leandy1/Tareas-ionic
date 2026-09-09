import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { NetworkService } from './network.service';
import { StorageService } from './storage.service';
import { PendingRecord } from '../models/pending-record.model';


const API_URL = 'https://tu-api.ejemplo.com/registros';


@Injectable({
  providedIn: 'root',
})
export class SyncService {

  private syncing = false; 

  constructor(
    private networkService: NetworkService,
    private storageService: StorageService,
    private http: HttpClient,
  ) {

    this.networkService.status$.subscribe(status => {
      if (status.connected) {
        this.syncPendingRecords();
      }
    });
  }

 
  public async saveRecord(payload: unknown): Promise<'sent' | 'queued'> {
    if (this.networkService.isOnline()) {
      try {
        await firstValueFrom(this.http.post(API_URL, payload));
        return 'sent';
      } catch (error) {
      
        console.warn('[SyncService] Envío falló con red disponible, se guarda localmente', error);
        await this.storageService.addPendingRecord(payload);
        return 'queued';
      }
    } else {
      await this.storageService.addPendingRecord(payload);
      return 'queued';
    }
  }

 
  public async syncPendingRecords(): Promise<void> {
    if (this.syncing) return;
    this.syncing = true;

    try {
      const pending: PendingRecord[] = await this.storageService.getPendingRecords();
      if (pending.length === 0) return;

      console.log(`[SyncService] Sincronizando ${pending.length} registro(s) pendiente(s)...`);

      for (const record of pending) {
        try {
          await firstValueFrom(this.http.post(API_URL, record.payload));
          await this.storageService.markAsSynced(record.id);
          console.log(`[SyncService] Registro ${record.id} sincronizado.`);
        } catch (error) {
      
          console.error(`[SyncService] Falló la sincronización de ${record.id}, se reintentará luego.`, error);
        }
      }
    } finally {
      this.syncing = false;
    }
  }
}
