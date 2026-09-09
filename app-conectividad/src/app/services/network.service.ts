import { Injectable, OnDestroy } from '@angular/core';
import { Network, ConnectionStatus } from '@capacitor/network';
import { PluginListenerHandle } from '@capacitor/core';
import { BehaviorSubject, Observable } from 'rxjs';


@Injectable({
  providedIn: 'root',
})
export class NetworkService implements OnDestroy {

  private readonly _status$ = new BehaviorSubject<ConnectionStatus>({
    connected: true,     
    connectionType: 'unknown',
  });

  
  public readonly status$: Observable<ConnectionStatus> = this._status$.asObservable();

 
  private readonly _lastUpdated$ = new BehaviorSubject<Date>(new Date());
  public readonly lastUpdated$: Observable<Date> = this._lastUpdated$.asObservable();

  
  private listenerHandle?: PluginListenerHandle;

  constructor() {
    this.init();
  }

  
  private async init(): Promise<void> {
  
    const initialStatus = await Network.getStatus();
    this._status$.next(initialStatus);
    this._lastUpdated$.next(new Date());

   
    this.listenerHandle = await Network.addListener('networkStatusChange', (status: ConnectionStatus) => {
      console.log('[NetworkService] Cambio de estado de red:', status);
      this._status$.next(status);
      this._lastUpdated$.next(new Date());
    });
  }

  
  public isOnline(): boolean {
    return this._status$.value.connected;
  }

 
  public getConnectionType(): string {
    return this._status$.value.connectionType;
  }

 
  public async refresh(): Promise<ConnectionStatus> {
    const current = await Network.getStatus();
    this._status$.next(current);
    return current;
  }

  ngOnDestroy(): void {
    this.listenerHandle?.remove();
  }
}
