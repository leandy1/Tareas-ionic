import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular';
import { NetworkStatusComponent } from '../components/network-status/network-status.component';
import { OfflineBannerComponent } from '../components/offline-banner/offline-banner.component';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, NetworkStatusComponent, OfflineBannerComponent],
})
export class HomePage {}