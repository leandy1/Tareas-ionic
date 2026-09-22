/**
 * Tarea: Unidad VI - Programación de dispositivos móviles
 * Desarrollado por: Sandy Ortiz
 * Matrícula: 100049907
 * 
 * Descripción: Implementación de mapa con Leaflet, GPS local (Capacitor) 
 * y búsqueda de lugares con Nominatim.
 */

import { Component, OnDestroy } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonSearchbar, IonFab, IonFabButton, IonIcon, IonButtons, IonButton
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { locateOutline, shareSocialOutline, mapOutline } from 'ionicons/icons';
import * as L from 'leaflet';
import { Geolocation } from '@capacitor/geolocation';
import { Share } from '@capacitor/share';

/**
 * HomePage: la pantalla principal de la app de localización.
 * Aquí se pinta el mapa con Leaflet, buscamos lugares con Nominatim
 * y mostramos la ubicación actual del usuario con el GPS.
 */
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonSearchbar, IonFab, IonFabButton, IonIcon, IonButtons, IonButton
  ],
})
export class HomePage implements OnDestroy {

  /** Instancia principal del mapa */
  public map: L.Map | undefined;

  /** Marcador de la ubicación actual del dispositivo */
  public currentMarker: L.Marker | undefined;

  /** Array para almacenar los pines de las búsquedas y poder limpiarlos */
  private searchMarkers: L.Marker[] = [];

  constructor() {
    addIcons({ locateOutline, shareSocialOutline, mapOutline });
  }

  /**
   * Hook de Ionic que se dispara cada vez que entramos a la página.
   * Lo uso para crear el mapa, porque para este momento ya el DOM está listo.
   */
  ionViewDidEnter() {
    this.initMap();
  }

  /**
   * Al salir de la página destruyo el mapa para no dejar memoria ocupada.
   */
  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  /**
   * Crea el mapa con Leaflet y le agrega los mosaicos de OpenStreetMap.
   * También arreglo los iconos de los marcadores para que se vean bien.
   */
  private initMap(): void {
    console.log('[Map] Inicializando mapa de Leaflet...');

    // Sin este parche, los marcadores por defecto salen "cuadrados" en Angular
    const defaultIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });
    L.Marker.prototype.options.icon = defaultIcon;

    // Coordenadas base (Santiago de los Caballeros, RD)
    this.map = L.map('map').setView([19.4517, -70.6970], 13);

    // Capa de los tiles de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Forzamos la actualización del tamaño del contenedor para evitar bugs visuales en Ionic
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 100);
  }

  /**
   * Pide permiso de ubicación y obtiene la posición actual del celular.
   * Después centra el mapa y pone un marcador en donde está el usuario.
   */
  public async getCurrentLocation(): Promise<void> {
    try {
      console.log('[GPS] Solicitando permisos y ubicación...');

      const hasPermission = await Geolocation.checkPermissions();
      if (hasPermission.location !== 'granted') {
        await Geolocation.requestPermissions();
      }

      const position = await Geolocation.getCurrentPosition();
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      console.log(`[GPS] Ubicación obtenida: ${lat}, ${lng}`);

      if (this.map) {
        this.map.setView([lat, lng], 16);

        if (this.currentMarker) {
          this.currentMarker.setLatLng([lat, lng]);
        } else {
          this.currentMarker = L.marker([lat, lng]).addTo(this.map)
            .bindPopup('¡Estás aquí!')
            .openPopup();
        }
      }
    } catch (error) {
      console.error('[GPS] Error obteniendo ubicación:', error);
      alert('No se pudo obtener la ubicación. Verifica que el GPS esté encendido.');
    }
  }

  /**
   * Busca lugares con la API gratuita de Nominatim (OpenStreetMap).
   * Limpia los marcadores de la búsqueda anterior y dibuja los resultados.
   */
  public async onSearchPlaces(event: any): Promise<void> {
    const query = event.target.value?.trim();
    if (!query) return;

    console.log('[Search] Buscando lugar:', query);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
      const data = await response.json();

      if (data && data.length > 0) {
        this.searchMarkers.forEach(marker => this.map?.removeLayer(marker));
        this.searchMarkers = [];

        const firstResult = data[0];
        this.map?.setView([firstResult.lat, firstResult.lon], 14);

        data.forEach((place: any) => {
          const marker = L.marker([place.lat, place.lon]).addTo(this.map!)
            .bindPopup(place.display_name);
          this.searchMarkers.push(marker);
        });
      }
    } catch (error) {
      console.error('[Search] Error en la API:', error);
    }
  }

  /**
   * Comparte la ubicación actual con el plugin de Share de Capacitor.
   * Se necesita tener el marcador del usuario activo para poder compartir.
   */
  public async shareLocation(): Promise<void> {
    if (!this.currentMarker) {
      alert('Por favor, primero encuentra tu ubicación usando el botón de GPS (abajo a la derecha).');
      return;
    }

    const { lat, lng } = this.currentMarker.getLatLng();
    const mapsLink = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

    try {
      await Share.share({
        title: 'Mi Ubicación',
        text: '¡Mira mi ubicación actual!',
        url: mapsLink,
        dialogTitle: 'Compartir Ubicación'
      });
    } catch (error) {
      console.error('[Share] Error al compartir:', error);
    }
  }
}