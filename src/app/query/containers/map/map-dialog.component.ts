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
  locations = [];
  private initMap(): void {
    // console.log('map when opening popup');
    // console.log(this.data.mapState);
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
    const items = [];
    this.mapState = this.data.mapState;
    for (const elem of this.mapState) {
      if (elem[0].match('circle') != null) {
        // console.log('CIRCLE');
        const colorOptions = {
          color: 'red',
          fillColor: '#f03',
          fillOpacity: 0
        }
        const circle = L.circle([elem[2], elem[1]], elem[3], colorOptions);
        circle.addTo(this.popUpMap);
        items.push(circle)
      } else if (elem[0].match('path') != null) {
        // console.log('PATH');
        // const path = L.path()
        const latlngs = [...elem];
        latlngs.shift(); // remove first element which is the indicator 'path'
        const polyline = L.polyline(latlngs, {color: 'red'});
        polyline.addTo(this.popUpMap);
        items.push(polyline);
      }
    }

    tiles.addTo(this.popUpMap);



    const drawnItems = new L.FeatureGroup(items);
    this.popUpMap.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
      draw: {
        polyline: {
          shapeOptions: {
            color: 'red',
            fillColor: '#f03',
            fillOpacity: 0
          }
        },
        polygon: false,
        circlemarker: false,
        rectangle: false,
        marker: false,
        edit: false,
        circle: {
          shapeOptions: {
            color: 'red',
            fillColor: '#f03',
            fillOpacity: 0
          },
        }
      },
      edit: {
        featureGroup: drawnItems, // tell which layer is editable
        edit: false
      }
    });
    this.popUpMap.addControl(drawControl);

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

  public addLocation() {
    // console.log('Add button pressed');
    this.locations.push({location: ''}); // new word
    // console.log(this.locations);
  }

  public removeLocation(i) {
    // console.log('Removed location');
    this.locations.splice(i, 1);
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
        // console.log(layer);
        const pathInfo = []; // pathInfo = ['path', [lat, lon], [lat, lon]]
        pathInfo.push('path');
        const latlngs = layer.getLatLngs();
        for (let i = 0; i < latlngs.length; i++) {
          pathInfo.push([latlngs[i].lat, latlngs[i].lng])
        }
        filterCoordinates.push(pathInfo);
      }
    });
    // console.log(filterCoordinates);
    this._dialogRef.close(filterCoordinates);
  }
}

