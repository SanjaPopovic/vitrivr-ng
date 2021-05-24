import {AfterViewInit, Component, Inject, Input, OnInit, ViewChild} from '@angular/core';
import * as L from 'leaflet';
import {MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogRef} from '@angular/material/dialog';
import 'leaflet-draw/dist/leaflet.draw';
import {MapQueryTermComponent} from './map-query-term.component';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Circle} from './circle';



@Component({
  selector: 'app-qt-map-dialog',
  templateUrl: 'map-dialog.component.html',
  styleUrls: ['./map-dialog.component.css']
})
export class MapDialogComponent implements OnInit {
  private popUpMap;
  private mapState: Circle[] = [];
  locations = [];
  private initMap(): void {
    this.popUpMap = L.map('popUpMap', {
      center: [ 47.5595986, 7.5885761 ],
      zoom: 8
    });

    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      minZoom: 1,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });

    // update to previous map state regarding circles
    const items = [];
    this.mapState = this.data.mapState;
    const colorOptions = {
      color: 'red',
      fillColor: '#f03',
      fillOpacity: 0
    }
    this.mapState.forEach((circle) => {
      if (circle.type === 'circle') {
        const newCircle = L.circle([circle.lat, circle.lon], circle.rad, colorOptions);
        newCircle.addTo(this.popUpMap);
        items.push(newCircle);
      } else if (circle.type === 'info') {
        // draw MARKER!
      }
    });

    tiles.addTo(this.popUpMap);

    const drawnItems = new L.FeatureGroup(items);
    this.popUpMap.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
      draw: {
        polyline: false,
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

  constructor(private _dialog: MatDialog, private _matsnackbar: MatSnackBar, private _dialogRef: MatDialogRef<MapDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: { mapState: Circle[] }) {
  }

  ngOnInit(): void {
    this.initMap();
  }

  public addLocation() {
    this.locations.push({location: ''}); // new word
  }

  public removeLocation(i) {
    this.locations.splice(i, 1);
  }

  /**
   * Closes the dialog.
   */
  public close() {
    const filterCoordinates: Circle[] = [];
    this.popUpMap.eachLayer(function (layer) {
      if (layer instanceof L.Circle) {
        console.log('check layer');
        const circle: Circle = {
          type: 'circle',
          semantic_name: '',
          lon: layer.getLatLng().lng,
          lat: layer.getLatLng().lat,
          rad: layer.getRadius(),
        }
        filterCoordinates.push(circle);
      }
    });
    console.log(filterCoordinates);
    this._dialogRef.close(filterCoordinates);
  }
}

