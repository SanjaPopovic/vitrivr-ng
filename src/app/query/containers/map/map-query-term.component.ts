import {AfterViewInit, Component, Input, OnInit, ViewChild} from '@angular/core';
import {MapQueryTerm} from '../../../shared/model/queries/map/map-query-term.model';
import * as L from 'leaflet';

@Component({
  selector: 'app-qt-map',
  templateUrl: 'map-query-term.component.html',
  styleUrls: ['./map-query-term.component.css']
})
export class MapQueryTermComponent implements OnInit {

  @Input()
  private mapTerm: MapQueryTerm;
  private map;

  private initMap(): void {
    this.map = L.map('map', {
      center: [ 47.5595986, 7.5885761 ],
      zoom: 8
    });

    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      minZoom: 3,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });

    tiles.addTo(this.map);
  }

  constructor() { }

  ngOnInit(): void {
    this.initMap();
  }
}
