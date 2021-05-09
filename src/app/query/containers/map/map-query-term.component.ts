import {AfterViewInit, Component, Input, OnInit, Output, ViewChild} from '@angular/core';
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
  @Output() mapState = [];

  // Instruction to create map is taken from https://www.digitalocean.com/community/tutorials/angular-angular-and-leaflet
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

  public updateMap(result: []) {
    /*console.log(result);
    // const drawnItems = new L.FeatureGroup();
    // this.map.addLayer(drawnItems);
    for (const elem of result) {
      if (elem[0].match('circle') != null) {
        // console.log('CIRCLE');
        const circle = L.circle([elem[1], elem[2]], elem[3]); // (circle, long, lat, rad)
        // circle.addTo(this.map);
      } else if (elem[0].match('path') != null) {
        // console.log('PATH');
        // const path = L.path()
      }
    }*/
  }

  /**
   * Triggered whenever someone clicks on the map, which indicates that
   * it should be edited; opens the MapDialogComponent
   */
  public onViewerClicked() {
    // console.log('before start');
    // console.log(this.mapState);
    const dialogRef = this._dialog.open(MapDialogComponent, {data: {mapState: this.mapState}});
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.length !== 0) {
        // console.log('result:');
        this.mapState = result;
        // this.map.invalidateSize();
        this.updateMap(result);
      }
    });
  }
}
