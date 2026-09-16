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
  IonCardContent,
  AlertController
} from '@ionic/angular';

import { CapacitorNfc } from '@capgo/capacitor-nfc';
import { App } from '@capacitor/app';

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
  private appStateListener: any = null;

  constructor(
    private alertController: AlertController
  ) {}

  async ngOnInit() {

    // Comprobar NFC al abrir la aplicación
    await this.verificarNFC();

    // Detectar cuando el usuario vuelve
    // desde la configuración de Android
    this.appStateListener = await App.addListener(
      'appStateChange',
      async ({ isActive }) => {

        if (isActive) {

          console.log(
            'La aplicación volvió a estar activa'
          );

          await this.verificarNFC();

        }

      }
    );
  }


  /**
   * Comprueba si el teléfono tiene NFC
   * y si está activado.
   */
  async verificarNFC() {

    try {

      // Comprobar si el dispositivo tiene NFC
      const resultado =
        await CapacitorNfc.isSupported();

      this.nfcDisponible =
        resultado.supported;

      if (!resultado.supported) {

        this.estado =
          'Este dispositivo no tiene NFC';

        return;
      }


      // Comprobar estado del NFC
      const estadoNfc =
        await CapacitorNfc.getStatus();

      console.log(
        'Estado NFC:',
        estadoNfc
      );


      if (
        estadoNfc.status === 'NFC_DISABLED'
      ) {

        this.estado =
          'NFC está desactivado';

        // Preguntar al usuario
        await this.preguntarActivarNFC();

        return;
      }


      // NFC está activado
      this.estado =
        'NFC disponible';


      // Comenzar escaneo automáticamente
      await this.iniciarEscaneoAutomatico();

    } catch (error) {

      console.error(
        'Error verificando NFC:',
        error
      );

      this.estado =
        'Error al verificar NFC';

      this.nfcDisponible = false;
    }
  }


  /**
   * Pregunta al usuario si desea activar NFC.
   */
  async preguntarActivarNFC() {

    const alert =
      await this.alertController.create({

        header: 'NFC desactivado',

        message:
          'El NFC está desactivado. ' +
          '¿Quieres abrir la configuración para activarlo?',

        buttons: [

          {
            text: 'No',

            role: 'cancel',

            handler: () => {

              this.estado =
                'NFC está desactivado';

              console.log(
                'El usuario decidió no activar NFC'
              );

            }
          },

          {
            text: 'Sí',

            handler: async () => {

              console.log(
                'El usuario aceptó activar NFC'
              );

              await this.abrirConfiguracion();

            }
          }

        ]

      });


    await alert.present();
  }


  /**
   * Abre la configuración NFC de Android.
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
   * Inicia el escaneo NFC automáticamente.
   */
  async iniciarEscaneoAutomatico() {

    try {

      // Evitar múltiples escaneos
      if (this.escaneando) {
        return;
      }


      this.escaneando = true;

      this.mensaje = '';
      this.tipoEtiqueta = '';

      this.estado =
        'Acerca un dispositivo NFC al teléfono';


      // Crear listener una sola vez
      if (!this.nfcListener) {

        this.nfcListener =
          await CapacitorNfc.addListener(
            'nfcEvent',
            async (event: any) => {

              console.log(
                'NFC detectado:',
                event
              );


              // Tipo de evento NFC
              this.tipoEtiqueta =
                event.type || 'NFC';


              // Datos recibidos
              this.mensaje =
                JSON.stringify(
                  event.tag || event,
                  null,
                  2
                );


              this.estado =
                'Etiqueta NFC detectada';


              // Detener lectura automáticamente
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


      // Comenzar lectura NFC
      await CapacitorNfc.startScanning();

      console.log(
        'Escaneo NFC iniciado'
      );

    } catch (error) {

      console.error(
        'Error iniciando NFC:',
        error
      );

      this.estado =
        'Error iniciando NFC';

      this.escaneando = false;
    }
  }


  /**
   * Limpieza al salir de la página.
   */
  async ngOnDestroy() {

    try {

      // Detener NFC
      await CapacitorNfc.stopScanning();


      // Eliminar listener NFC
      if (this.nfcListener) {

        await this.nfcListener.remove();

        this.nfcListener = null;
      }


      // Eliminar listener de estado de la app
      if (this.appStateListener) {

        await this.appStateListener.remove();

        this.appStateListener = null;
      }

    } catch (error) {

      console.error(
        'Error cerrando NFC:',
        error
      );

    }

  }

}