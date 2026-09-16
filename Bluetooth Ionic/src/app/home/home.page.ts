import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonCardContent
} from '@ionic/angular';

import { CapacitorNfc } from '@capgo/capacitor-nfc';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,

  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonCardContent
  ]
})
export class HomePage implements OnInit, OnDestroy {

  estado = 'Comprobando NFC...';
  mensaje = '';
  tipoEtiqueta = '';

  nfcDisponible = false;
  escaneando = false;

  private nfcListener: any = null;

  async ngOnInit() {
    await this.verificarNFC();

    // Si el teléfono tiene NFC y está activado,
    // comienza a escuchar automáticamente.
    if (
      this.nfcDisponible &&
      this.estado !== 'NFC está desactivado'
    ) {
      await this.iniciarEscaneoAutomatico();
    }
  }

  /**
   * Verifica si el dispositivo tiene NFC
   * y si el NFC está activado.
   */
  async verificarNFC() {
    try {
      const resultado = await CapacitorNfc.isSupported();

      this.nfcDisponible = resultado.supported;

      if (!resultado.supported) {
        this.estado = 'Este dispositivo no tiene NFC';
        return;
      }

      const estadoNfc = await CapacitorNfc.getStatus();

      if (estadoNfc.status === 'NFC_DISABLED') {
        this.estado = 'NFC está desactivado';
      } else {
        this.estado = 'NFC disponible';
      }

    } catch (error) {
      console.error('Error verificando NFC:', error);

      this.estado = 'Error al verificar NFC';
      this.nfcDisponible = false;
    }
  }

  /**
   * Inicia la lectura NFC automáticamente.
   *
   * No hace falta presionar ningún botón.
   * Cuando se detecta un dispositivo/etiqueta NFC,
   * se muestran los datos y se detiene la lectura.
   */
  async iniciarEscaneoAutomatico() {
    try {

      // Evita iniciar dos lectores al mismo tiempo.
      if (this.escaneando) {
        return;
      }

      this.escaneando = true;
      this.mensaje = '';
      this.tipoEtiqueta = '';

      this.estado = 'Acerca un dispositivo NFC al teléfono';

      // Registramos el listener solamente una vez.
      if (!this.nfcListener) {

        this.nfcListener = await CapacitorNfc.addListener(
          'nfcEvent',
          async (event: any) => {

            console.log('NFC detectado:', event);

            // Guardamos el tipo de evento.
            this.tipoEtiqueta = event.type || 'NFC';

            // Mostramos los datos recibidos.
            this.mensaje = JSON.stringify(
              event.tag || event,
              null,
              2
            );

            this.estado = 'Etiqueta NFC detectada';

            // En Android detenemos explícitamente
            // la lectura después de detectar una etiqueta.
            try {
              await CapacitorNfc.stopScanning();
            } catch (error) {
              console.error(
                'Error deteniendo NFC:',
                error
              );
            } finally {
              this.escaneando = false;
            }
          }
        );
      }

      // Comienza la escucha NFC.
      await CapacitorNfc.startScanning();

      console.log('Escaneo NFC iniciado');

    } catch (error) {

      console.error(
        'Error iniciando NFC:',
        error
      );

      this.estado = 'Error iniciando NFC';
      this.escaneando = false;
    }
  }

  /**
   * Abre la configuración NFC del teléfono.
   */
  async abrirConfiguracion() {
    try {

      await CapacitorNfc.showSettings();

    } catch (error) {

      console.error(
        'Error abriendo configuración NFC:',
        error
      );
    }
  }

  /**
   * Se ejecuta cuando se destruye la página.
   * Detiene NFC y elimina el listener.
   */
  async ngOnDestroy() {
    try {

      await CapacitorNfc.stopScanning();

      if (this.nfcListener) {
        await this.nfcListener.remove();
        this.nfcListener = null;
      }

    } catch (error) {

      console.error(
        'Error cerrando NFC:',
        error
      );
    }
  }
}