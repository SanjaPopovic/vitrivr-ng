import {AfterViewInit, Component, Input, OnInit, ViewChild} from '@angular/core';
import * as L from 'leaflet';
import {MatDialog, MatDialogConfig, MatDialogRef} from '@angular/material/dialog';
import 'leaflet-draw/dist/leaflet.draw';

@Component({
  selector: 'app-qt-map-dialog',
  templateUrl: 'map-dialog.component.html',
  styleUrls: ['./map-dialog.component.css']
})
export class MapDialogComponent implements OnInit {
  private popUpMap;

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

    tiles.addTo(this.popUpMap);

    const drawnItems = new L.FeatureGroup();
    this.popUpMap.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
      draw: {
        polyline: true,
        polygon: false,
        circlemarker: false,
        rectangle: true,
        marker: false,
        edit: false
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
      if (type === 'rectangle') {layer.bindPopup('A rectangle!'); }
      drawnItems.addLayer(layer);
    });

  }

  constructor(private _dialog: MatDialog, private _dialogRef: MatDialogRef<MapDialogComponent>) { }

  ngOnInit(): void {
    this.initMap();
  }

  /**
   * Closes the dialog.
   */
  public close() {
    this._dialogRef.close();
  }
}

