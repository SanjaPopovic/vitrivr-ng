import {AfterViewInit, Component, Inject, Input, OnInit, ViewChild} from '@angular/core';
import * as L from 'leaflet';
import {MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogRef} from '@angular/material/dialog';
import 'leaflet-draw/dist/leaflet.draw';
import {MapQueryTermComponent} from './map-query-term.component';



@Component({
  selector: 'app-qt-map-dialog',
  templateUrl: 'map-dialog.component.html',
  styleUrls: ['./map-dialog.component.css']
})
export class MapDialogComponent implements OnInit {
  private popUpMap;
  private mapState;
  private initMap(): void {
    console.log('map when opening popup');
    console.log(this.data.mapState);
    this.popUpMap = L.map('popUpMap', {
      center: [ 47.5595986, 7.5885761 ],
      zoom: 8
    });

    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      minZoom: 1,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });

    // --------update to previous map state regarding circles
    this.mapState = this.data.mapState;
    for (const elem of this.mapState) {
      if (elem[0].match('circle') != null) {
        // console.log('CIRCLE');
        const center = [elem[1], elem[2]];
        const circleOptions = {
          color: 'red',
          fillColor: '#f03',
          fillOpacity: 0
        }
        // console.log(center, elem[3], circleOptions);
        L.circle([elem[2], elem[1]], elem[3], circleOptions).addTo(this.popUpMap);
        /*const circleCenter = [40.72, -74.00];
        const circleOptions = {
          color: 'red',
          fillColor: '#f03',
          fillOpacity: 0
        }
        const circle = L.circle(circleCenter, 50000, circleOptions);*/
      } else if (elem[0].match('path') != null) {
        // console.log('PATH');
        // const path = L.path()
      }
    }

    tiles.addTo(this.popUpMap);



    const drawnItems = new L.FeatureGroup();
    this.popUpMap.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
      draw: {
        polyline: true,
        polygon: false,
        circlemarker: false,
        rectangle: false,
        marker: false,
        edit: false
      },
      edit: {
        featureGroup: drawnItems, // tell which layer is editable
        edit: false
      }
    });
    this.popUpMap.addControl(drawControl);

    const filterCoordinates = [];
    this.popUpMap.on('draw:created', function (e) {
      const type = e.layerType,
        layer = e.layer;
      // if (type === 'rectangle') {layer.bindPopup('A rectangle!'); }
      drawnItems.addLayer(layer);

      // console.log (drawnItems.getLayers()); // each layer has one circle or path
      if (layer instanceof L.Circle) {
        // console.log('ITS A CIRCLE')
        // filterCoordinates.push(['circle', layer.getLatLng(), layer.getRadius()]);
        // console.log(filterCoordinates);
      } else if (layer instanceof L.Path) {
        // console.log('ITS A PATH')
      }

    });


  }

  constructor(private _dialog: MatDialog, private _dialogRef: MatDialogRef<MapDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: {mapState: []}) { }

  ngOnInit(): void {
    this.initMap();
  }

  /**
   * Closes the dialog.
   */
  public close() {
    const filterCoordinates = [];
    this.popUpMap.eachLayer(function (layer) {
      if (layer instanceof L.Circle) {
        filterCoordinates.push(['circle', layer.getLatLng().lng, layer.getLatLng().lat, layer.getRadius()]);
      } else if (layer instanceof L.Path) {
        const pathInfo = [];
        pathInfo.push('path');
        const latlngs = layer.getLatLngs();
        for (let i = 0; i < latlngs.length; i++) {
          pathInfo.push([latlngs[i].lng, latlngs[i].lat])
        }
        filterCoordinates.push(pathInfo);
      }
    });
    // console.log(filterCoordinates);
    this._dialogRef.close(filterCoordinates);
  }
}

