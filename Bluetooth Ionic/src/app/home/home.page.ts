import { Component, OnInit, OnDestroy, signal } from '@angular/core';
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

  estado = signal('Comprobando NFC...');
  mensaje = signal('');
  tipoEtiqueta = signal('');

  nfcDisponible = signal(false);
  escaneando = signal(false);

  private nfcListener: any = null;
  private appStateListener: any = null;

  constructor(
    private alertController: AlertController
  ) {}

  async ngOnInit() {

    await this.verificarNFC();

    this.appStateListener = await App.addListener(
      'appStateChange',
      async ({ isActive }) => {

        if (isActive) {

          console.log(
            'La aplicacion volvio a estar activa'
          );

          await this.verificarNFC();

        }

      }
    );
  }


  /**
   * Comprueba si el telefono tiene NFC
   * y si esta activado.
   */
  async verificarNFC() {

    try {

      const resultado =
        await CapacitorNfc.isSupported();

      this.nfcDisponible.set(resultado.supported);

      if (!resultado.supported) {

        this.estado.set('Este dispositivo no tiene NFC');

        return;
      }


      const estadoNfc =
        await CapacitorNfc.getStatus();

      console.log('Estado NFC:', estadoNfc);


      if (
        estadoNfc.status === 'NFC_DISABLED'
      ) {

        this.estado.set('NFC esta desactivado');

        await this.preguntarActivarNFC();

        return;
      }


      this.estado.set('NFC disponible');

      await this.iniciarEscaneoAutomatico();

    } catch (error) {

      console.error(
        'Error verificando NFC:',
        error
      );

      this.estado.set('Error al verificar NFC');
      this.nfcDisponible.set(false);
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
          'El NFC esta desactivado. ' +
          'Quieres abrir la configuracion para activarlo?',

        buttons: [

          {
            text: 'No',

            role: 'cancel',

            handler: () => {

              this.estado.set('NFC esta desactivado');

              console.log(
                'El usuario decidio no activar NFC'
              );

            }
          },

          {
            text: 'Si',

            handler: async () => {

              console.log(
                'El usuario acepto activar NFC'
              );

              await this.abrirConfiguracion();

            }
          }

        ]

      });


    await alert.present();
  }


  /**
   * Abre la configuracion NFC de Android.
   */
  async abrirConfiguracion() {

    try {

      await CapacitorNfc.showSettings();

    } catch (error) {

      console.error(
        'Error abriendo configuracion NFC:',
        error
      );

    }

  }


  /**
   * Inicia el escaneo NFC automaticamente.
   */
  async iniciarEscaneoAutomatico() {

    try {

      if (this.escaneando()) {
        return;
      }


      this.escaneando.set(true);

      this.mensaje.set('');
      this.tipoEtiqueta.set('');

      this.estado.set('Acerca un dispositivo NFC al telefono');


      if (!this.nfcListener) {

        this.nfcListener =
          await CapacitorNfc.addListener(
            'nfcEvent',
            async (event: any) => {

              console.log(
                'NFC detectado:',
                event
              );


              this.tipoEtiqueta.set(
                event.type || 'NFC'
              );


              this.mensaje.set(
                JSON.stringify(
                  event.tag || event,
                  null,
                  2
                )
              );


              this.estado.set('Etiqueta NFC detectada');


              try {

                await CapacitorNfc.stopScanning();

              } catch (error) {

                console.error(
                  'Error deteniendo NFC:',
                  error
                );

              } finally {

                this.escaneando.set(false);

              }

            }
          );
      }


      await CapacitorNfc.startScanning();

      console.log('Escaneo NFC iniciado');

    } catch (error) {

      console.error(
        'Error iniciando NFC:',
        error
      );

      this.estado.set('Error iniciando NFC');
      this.escaneando.set(false);
    }
  }


  /**
   * Limpieza al salir de la pagina.
   */
  async ngOnDestroy() {

    try {

      await CapacitorNfc.stopScanning();

      if (this.nfcListener) {

        await this.nfcListener.remove();

        this.nfcListener = null;
      }

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
