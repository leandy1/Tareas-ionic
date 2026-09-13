import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonSpinner,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { bluetoothOutline, bluetooth, stopCircleOutline, linkOutline } from 'ionicons/icons';

interface BleDeviceVm {
  deviceId: string;
  name: string | null;
  rssi: number;
  connected: boolean;
}

interface GattServiceVm {
  name: string;
  uuid: string;
  characteristics: string[];
}

addIcons({
  'bluetooth-outline': bluetoothOutline,
  'bluetooth': bluetooth,
  'stop-circle-outline': stopCircleOutline,
  'link-outline': linkOutline,
});

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonSpinner],
})
export class HomePage {

  isScanning = false;
  devices: BleDeviceVm[] = [];

  // --- Funcionalidad nueva: detalle de dispositivo + exploración de servicios GATT ---
  selectedDevice: BleDeviceVm | null = null;
  loadingServices = false;
  gattServices: GattServiceVm[] = [];

  toggleScan(): void {
    this.isScanning = !this.isScanning;

    if (this.isScanning) {
      // Datos simulados solo para maquetar el diseño; se reemplazan por
      // BleClient.requestLEScan() al conectar el servicio real.
      setTimeout(() => {
        this.devices = [
          { deviceId: '3C:71:BF:12:AA:01', name: 'Audífonos JBL', rssi: -52, connected: false },
          { deviceId: '8A:22:0F:9B:C3:44', name: 'Smartband Mi Band', rssi: -68, connected: false },
          { deviceId: '1F:5D:AC:77:E0:12', name: null, rssi: -84, connected: false },
        ];
        this.isScanning = false;
      }, 1600);
    } else {
      this.devices = [];
    }
  }

  connectedCount(): number {
    return this.devices.filter(d => d.connected).length;
  }

  selectDevice(device: BleDeviceVm): void {
    this.selectedDevice = device;
    this.gattServices = [];
  }

  closeDetail(): void {
    this.selectedDevice = null;
    this.gattServices = [];
  }

  toggleConnection(): void {
    if (!this.selectedDevice) return;
    this.selectedDevice.connected = !this.selectedDevice.connected;

    // Refleja el cambio también en la lista principal (misma referencia de objeto,
    // pero se fuerza detección de cambios simple para el ejemplo de diseño).
    const idx = this.devices.findIndex(d => d.deviceId === this.selectedDevice!.deviceId);
    if (idx > -1) this.devices[idx].connected = this.selectedDevice.connected;

    if (this.selectedDevice.connected) {
      this.discoverServices();
    } else {
      this.gattServices = [];
    }
  }

  private discoverServices(): void {
    this.loadingServices = true;
    // Simulación del descubrimiento de servicios GATT. Al conectar el plugin
    // real, esto se reemplaza por BleClient.getServices(deviceId).
    setTimeout(() => {
      this.gattServices = [
        {
          name: 'Battery Service',
          uuid: '0000180f-0000-1000-8000-00805f9b34fb',
          characteristics: ['Battery Level'],
        },
        {
          name: 'Device Information',
          uuid: '0000180a-0000-1000-8000-00805f9b34fb',
          characteristics: ['Manufacturer', 'Model Number', 'Firmware Rev.'],
        },
      ];
      this.loadingServices = false;
    }, 1200);
  }

  signalLevel(rssi: number): 1 | 2 | 3 | 4 {
    if (rssi >= -55) return 4;
    if (rssi >= -70) return 3;
    if (rssi >= -85) return 2;
    return 1;
  }
}