import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonCardContent, IonIcon } from '@ionic/angular';
import { Observable, map } from 'rxjs';
import { NetworkService } from '../../services/network.service';

@Component({
  selector: 'app-offline-banner',
  standalone: true,
  imports: [CommonModule, IonCard, IonCardContent, IonIcon],
  template: `
    <ion-card *ngIf="isOffline$ | async" class="offline-card">
      <ion-card-content class="offline-content">
        <ion-icon name="cloud-offline-outline"></ion-icon>
        <div class="offline-text">
          <strong>Estás trabajando sin conexión</strong>
          <p>Tus datos se guardarán en este dispositivo y se enviarán automáticamente al servidor en cuanto vuelva la señal.</p>
        </div>
      </ion-card-content>
    </ion-card>
  `,
  styles: [`
    .offline-card { margin: 12px 16px; border-radius: 14px; border-left: 4px solid var(--ion-color-warning, #ffc409); }
    .offline-content { display: flex; align-items: flex-start; gap: 10px; }
    .offline-content ion-icon { font-size: 22px; color: var(--ion-color-warning, #ffc409); margin-top: 2px; }
    .offline-text strong { display: block; margin-bottom: 4px; font-size: 14px; }
    .offline-text p { margin: 0; font-size: 12.5px; color: var(--ion-color-medium, #92949c); }
  `],
})
export class OfflineBannerComponent implements OnInit {
  isOffline$!: Observable<boolean>;
  constructor(private networkService: NetworkService) {}
  ngOnInit(): void {
    this.isOffline$ = this.networkService.status$.pipe(map(status => !status.connected));
  }
}