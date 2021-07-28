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

/**
 * This component is responsible for the view which gets created when the user creates a map query term.
 * It updates the mini-map if the user added new circles or pins to the popup-map (MapDialogComponent).
 */
@Component({
  selector: 'app-qt-map',
  templateUrl: 'map-query-term.component.html',
  styleUrls: ['map-query-term.component.css']
})
export class MapQueryTermComponent implements AfterViewInit {

  @Input()
  private mapTerm: MapQueryTerm;
  private map;
  @Output() mapState: Circle[] = [];
  @Input() id: number;
  map_list = [];

  // Instruction to create map is taken from https://www.digitalocean.com/community/tutorials/angular-angular-and-leaflet
  private initMap(): void {
    this.map = L.map('map' + this.id, {
      center: [47.5595986, 7.5885761],
      zoom: 3
    });

    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      minZoom: 1,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });

    tiles.addTo(this.map);

  }

  constructor(private _dialog: MatDialog) {

  }

  ngOnInit() {
    console.log('ID of map in added/moved query term = ' + this.id);
    this.map_list.push(this.id);
  }

  ngAfterViewInit(): void {
    this.initMap();
    if (this.mapTerm.getData().length !== 0 || this.mapTerm.getData() !== null) {
      this.updateMap(this.mapTerm.getData());
    }
  }

  public updateMap(result: Circle[]) {
    this.map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) {
        layer.remove();
      }
    });
    this.mapState.length = 0;
    const colorOptions = {
      color: 'red',
      fillColor: '#f03',
      fillOpacity: 0
    }
    console.log('data that will go to cineast')
    result.forEach((res) => {
      if (res.type === 'circle') { // other case when res[0]==='info'. This comes from MapTag
        const circle = L.circle([res.lat, res.lon], res.rad, colorOptions);
        circle.addTo(this.map);
        this.mapState.push(res);
      } else if (res.type === 'info') {
        // draw MARKER!
        // const circle = L.circle([res.lat, res.lon], res.rad, colorOptions);
        const marker = L.marker([res.lat, res.lon], colorOptions);
        marker.addTo(this.map);
        this.mapState.push(res);
      }
      console.log(res);
    });
  }

  /**
   * Triggered whenever someone clicks on the map, which indicates that
   * it should be edited; opens the MapDialogComponent
   */
  public onViewerClicked() {
    const dialogRef = this._dialog.open(MapDialogComponent, {data: {mapState: this.mapState}});
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('result = ' + result);
        this.updateMap(result);
        this.addRegion();
      }
    });
  }

  /**
   * Add the specified region (circle) to the list of regions. Take info from variable mapState.
   * Removing a region also happens here.
   * @param String The Region that should be added.
   */
  public addRegion() {
    this.mapTerm.data = 'data:application/json;base64,' + btoa(JSON.stringify(this.mapState.map(v => {
      return v;
    })));
    this.mapTerm.setData(this.mapState);
  }
}
