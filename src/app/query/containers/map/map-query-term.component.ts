import {AfterViewInit, Component, Input, OnInit, ViewChild} from '@angular/core';
import {MapQueryTerm} from '../../../shared/model/queries/map/map-query-term.model';
import * as L from 'leaflet';
import {SemanticMap} from '../../../shared/model/queries/semantic/semantic-map.model';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {SemanticSketchDialogComponent} from '../semantic/semantic-sketch-dialog.component';
import {first} from 'rxjs/operators';
import {MapDialogComponent} from './map-dialog.component';

@Component({
  selector: 'app-qt-map',
  templateUrl: 'map-query-term.component.html',
  styleUrls: ['./map-query-term.component.css']
})
export class MapQueryTermComponent implements OnInit {

  @Input()
  private mapTerm: MapQueryTerm;
  @ViewChild('map', {static: true})
  private map;

  private initMap(): void {
    this.map = L.map('map', {
      center: [ 47.5595986, 7.5885761 ],
      zoom: 8
    });

    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      minZoom: 1,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });

    tiles.addTo(this.map);
  }

  constructor(private _dialog: MatDialog) { }

  ngOnInit(): void {
    this.initMap();
  }

  /**
   * Triggered whenever someone clicks on the map, which indicates that
   * it should be edited; opens the SketchDialogComponent
   */
  public onViewerClicked() {
    const dialogRef = this._dialog.open(MapDialogComponent);
    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
  }
}
