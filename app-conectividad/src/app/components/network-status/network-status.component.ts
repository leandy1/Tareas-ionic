import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonIcon } from '@ionic/angular';
import { Observable, combineLatest, map } from 'rxjs';
import { ConnectionStatus } from '@capacitor/network';
import { NetworkService } from '../../services/network.service';

interface NetworkViewModel {
  connected: boolean;
  connectionType: string;
  lastUpdated: string;
}

@Component({
  selector: 'app-network-status',
  standalone: true,
  imports: [CommonModule, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonIcon],
  templateUrl: './network-status.component.html',
  styleUrls: ['./network-status.component.scss'],
})
export class NetworkStatusComponent implements OnInit {
  vm$!: Observable<NetworkViewModel>;
  constructor(private networkService: NetworkService) {}
  ngOnInit(): void {
    this.vm$ = combineLatest([
      this.networkService.status$,
      this.networkService.lastUpdated$,
    ]).pipe(
      map(([status, updated]: [ConnectionStatus, Date]) => ({
        connected: status.connected,
        connectionType: status.connectionType,
        lastUpdated: updated.toLocaleTimeString('es-DO'),
      }))
    );
  }
}