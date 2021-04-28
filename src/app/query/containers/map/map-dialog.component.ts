import {AfterViewInit, Component, Input, OnInit, ViewChild} from '@angular/core';
import {MapQueryTerm} from '../../../shared/model/queries/map/map-query-term.model';
import * as L from 'leaflet';
import {SemanticMap} from '../../../shared/model/queries/semantic/semantic-map.model';
import {MatDialog, MatDialogConfig, MatDialogRef} from '@angular/material/dialog';
import {SemanticSketchDialogComponent} from '../semantic/semantic-sketch-dialog.component';
import {first} from 'rxjs/operators';

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

