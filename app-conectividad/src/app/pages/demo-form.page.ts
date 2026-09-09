import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonItem, IonLabel, IonInput, IonButton } from '@ionic/angular';
import { SyncService } from '../services/sync.service';

@Component({
  selector: 'app-demo-form',
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonItem, IonLabel, IonInput, IonButton],
  template: `
    <ion-content class="ion-padding">
      <ion-item>
        <ion-label position="stacked">Nuevo elemento</ion-label>
        <ion-input [(ngModel)]="texto" placeholder="Escribe algo..."></ion-input>
      </ion-item>

      <ion-button expand="block" class="ion-margin-top" (click)="guardar()">
        Guardar
      </ion-button>

      <p *ngIf="ultimoResultado" class="ion-margin-top">
        Resultado: <strong>{{ ultimoResultado === 'sent' ? 'Enviado al servidor' : 'Guardado localmente (pendiente)' }}</strong>
      </p>
    </ion-content>
  `,
})
export class DemoFormPage {

  texto = '';
  ultimoResultado: 'sent' | 'queued' | null = null;

  constructor(private syncService: SyncService) {}

  async guardar(): Promise<void> {
    if (!this.texto.trim()) return;

    this.ultimoResultado = await this.syncService.saveRecord({ texto: this.texto });
    this.texto = '';
  }
}