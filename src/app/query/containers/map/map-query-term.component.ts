import {AfterViewInit, Component, Input, OnInit, Output, ViewChild} from '@angular/core';
import {MapQueryTerm} from '../../../shared/model/queries/map/map-query-term.model';
import * as L from 'leaflet';
import {SemanticMap} from '../../../shared/model/queries/semantic/semantic-map.model';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {SemanticSketchDialogComponent} from '../semantic/semantic-sketch-dialog.component';
import {first} from 'rxjs/operators';
import {MapDialogComponent} from './map-dialog.component';
import {Tag} from '../../../../../openapi/cineast';
import {Circle} from './circle';

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
  private circles: Circle[] = [];

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

  public updateMap() {
    this.map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) {
        layer.remove();
      }
    });
    if (this.mapState.length > 0) {
      const items = [];

      for (const elem of this.mapState) {
        if (elem[0].match('circle') != null) {
          const colorOptions = {
            color: 'red',
            fillColor: '#f03',
            fillOpacity: 0
          }
          const circle = L.circle([elem[2], elem[1]], elem[3], colorOptions);
          circle.addTo(this.map);
          items.push(circle)
        } else if (elem[0].match('path') != null) {
          const latlngs = [...elem];
          latlngs.shift(); // remove first element which is the indicator 'path'
          const polyline = L.polyline(latlngs, {color: 'red'});
          polyline.addTo(this.map);
          items.push(polyline);
        }
      }
    }
  }

  /**
   * Triggered whenever someone clicks on the map, which indicates that
   * it should be edited; opens the MapDialogComponent
   */
  public onViewerClicked() {
    const dialogRef = this._dialog.open(MapDialogComponent, {data: {mapState: this.mapState}});
    dialogRef.afterClosed().subscribe(result => {
      if (this.mapState.length > 0 && result.length === 0) { // delete everything on mini map
        this.mapState = [];
        this.updateMap();
        this.addRegion();
      } else if (result.length !== 0 && JSON.stringify(result) !== JSON.stringify(this.mapState)) {
        this.mapState = result;
        this.updateMap();
        this.addRegion();
      }
    });
  }

  /**
   * Add the specified region (at the moment: circle or path) to the list of regions. Take info from variable mapState.
   * Removing a region also happens here.
   * @param String The Region that should be added.
   */
  public addRegion() {
    console.log(this.mapState);
    for (const elem of this.mapState) {
      if (elem[0].match('circle') != null) { // if it is a circle, and not a path
        const circle: Circle = {
          type: 'circle',
          lat: elem[2],
          lon: elem[1],
          rad: elem[3]
        }
        this.circles.push(circle);
      }
    }
    this.mapTerm.data = 'data:application/json;base64,' + btoa(JSON.stringify(this.circles.map(v => {
      return v;
    })));
    console.log(this.circles);
  }
}
