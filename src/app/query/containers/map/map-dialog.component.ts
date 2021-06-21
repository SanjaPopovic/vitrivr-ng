import {AfterViewInit, Component, Inject, Input, OnInit, ViewChild} from '@angular/core';
import * as L from 'leaflet';
import {MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogRef} from '@angular/material/dialog';
import 'leaflet-draw/dist/leaflet.draw';
import {MapQueryTermComponent} from './map-query-term.component';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Circle} from './circle';
import {MapLookupService} from '../../../core/lookup/map-lookup.service';
import {SelectResult, Tag, TagService} from '../../../../../openapi/cineast';
import {EMPTY, Observable} from 'rxjs';
import {FormControl} from '@angular/forms';
import {debounceTime, first, map, mergeAll, startWith} from 'rxjs/operators';
import {MatAutocompleteSelectedEvent} from '@angular/material/autocomplete';

const iconRetinaUrl = './assets/marker-icon-2x.png';
const iconUrl = './assets/marker-icon.png';
const shadowUrl = './assets/marker-shadow.png';
const iconDefault = L.icon({
  iconRetinaUrl, iconUrl, shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = iconDefault;

@Component({
  selector: 'app-qt-map-dialog',
  templateUrl: 'map-dialog.component.html',
  styleUrls: ['./map-dialog.component.css']
})
export class MapDialogComponent implements OnInit {
  private popUpMap;
  // Save both: drawn circle and entered tag-like locations.
  // Both will be saved as Circle-Objects.
  // How to distinguish them: circle.type = 'info' and circle.type = 'circle'
  private mapState: Circle[] = [];
  private markers: Circle[] = [];
  private drawnCircles: Circle[] = [];
  private test_markers: Array<{ [semantic_name: string]: [Circle, L.marker]; }>;
  private test_drawnCircles: (number|L.circle)[][]; // [] = rad, lon, lat, L.circle

  private drawnItems;
  /** List of tag fields currently displayed. */
  private readonly _field: FieldGroup;

  private initMap(): void {
    this.popUpMap = L.map('popUpMap', {
      center: [47.5595986, 7.5885761],
      zoom: 5
    });

    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      minZoom: 1,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });

    const items = [];
    const colorOptions = {
      color: 'red',
      fillColor: '#f03',
      fillOpacity: 0
    }


    tiles.addTo(this.popUpMap);

    this.test_drawnCircles = [];
    this.test_markers = Array<{ [semantic_name: string]: [Circle, L.marker]; }>();
    this.data.mapState.forEach((circle) => {
      if (circle.type === 'circle') {
        const newCircle = L.circle([circle.lat, circle.lon], circle.rad, colorOptions);
        newCircle.addTo(this.popUpMap);
        items.push(newCircle);
        this.drawnCircles.push(circle);
        this.test_drawnCircles.push([circle.rad, circle.lon, circle.lat, newCircle]);
      } else if (circle.type === 'info') {
        // draw Marker!
        const marker = L.marker([circle.lat, circle.lon]);
        marker.id = circle.semantic_name;
        marker.addTo(this.popUpMap).bindPopup(circle.semantic_name);
        items.push(marker);
        this.markers.push(circle);
        const tempDict = {} // save <circle-object and corresponding marker in map>
        tempDict[circle.semantic_name] = [circle, marker];
        this.test_markers.push(tempDict);
      }
    });

    this.drawnItems = new L.FeatureGroup(items);
    this.popUpMap.addLayer(this.drawnItems);

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
        featureGroup: this.drawnItems, // tell which layer is editable
        edit: false
      }
    });
    const __this = this.drawnItems;
    this.popUpMap.addControl(drawControl);
    const _this = this;
    this.popUpMap.on('draw:created', function (e) {
      const type = e.layerType,
        layer = e.layer;

      __this.addLayer(layer);

      if (layer instanceof L.Circle) {
        const circle: Circle = {
          type: 'circle',
          semantic_name: '',
          lon: layer.getLatLng().lng,
          lat: layer.getLatLng().lat,
          rad: layer.getRadius()
        }
        _this.updateDrawnCircles(circle, layer);
      }
    });
    this.popUpMap.on('draw:deleted', function (e) {
      const type = e.layerType,
        layer = e.layer;
      // __this.addLayer(layer);
      console.log('DELETED')
      _this.deleteMarker();
    });
  }

  public updateDrawnCircles(circle: Circle, layer: L.circle) {
    this.drawnCircles.push(circle);
    this.test_drawnCircles.push([circle.rad, circle.lon, circle.lat, layer]);
    console.log(this.test_drawnCircles);
  }

  public updateMarkers(marker: Circle) {
    const colorOptions = {
      color: 'red',
      fillColor: '#f03',
      fillOpacity: 0
    }
    const markerInPopUp = L.marker([marker.lat, marker.lon], colorOptions);
    markerInPopUp.addTo(this.popUpMap).bindPopup(marker.semantic_name);
    this.drawnItems.addLayer(markerInPopUp);

    const tempDict = {} // save <circle-object and corresponding marker in map>
    tempDict[marker.semantic_name] = [marker, markerInPopUp]; // new dictionary with one key
    this.test_markers.push(tempDict);
    console.log('this.test_markers + ' + this.test_markers);
  }

  // tslint:disable-next-line:max-line-length
  constructor(private _mapService: MapLookupService, private _dialog: MatDialog, private _matsnackbar: MatSnackBar, private _dialogRef: MatDialogRef<MapDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: { mapState: Circle[] }) {
    this._field = new FieldGroup(_mapService);
  }

  public deleteMarker(marker?: Circle) {
    if (typeof marker === 'undefined') { // if circle or marker are deleted in map!
      const _this = this;
      const markers_on_map = [];
      const circles_on_map: Circle[] = [];
      this.popUpMap.eachLayer(function (layer) {
        if (layer instanceof L.Marker) {
          markers_on_map.push(layer._popup._content);
        } else if (layer instanceof L.Circle) {
          console.log('WUUUUUT');
          console.log(layer);
          const circle: Circle = {
            type: 'circle',
            semantic_name: '',
            lon: layer.getLatLng().lng,
            lat: layer.getLatLng().lat,
            rad: layer.getRadius()
          }
          // const temp = [layer._mRadius, layer._latlng.lng, layer._latlng.lat];
          circles_on_map.push(circle);
        }
      });
      for (let i = this.test_markers.length - 1; i >= 0; i--) { // go through all markers in map
        let key = '';
        for (key in this.test_markers[i]) { // get value of key, which is semantic_name
        }
        if (markers_on_map.indexOf(key) < 0) { // deleted in map -> delete in tags
          const index = this.markers.indexOf(this.test_markers[i][key][0]);
          if (index > -1) {
            this.markers.splice(index, 1);
            this.test_markers.splice(i, 1);
          }
        }
      }
      console.log('circles on map = ' + circles_on_map);
      for (let i = this.test_drawnCircles.length - 1; i >= 0; i--) { // go through all circles in map
        const rad = i[0], lon = i[1], lat = i[2];
        let isPresent = false;
        for (let j = 0; j < circles_on_map.length && isPresent === false; j++) {
          if (rad === circles_on_map[j].rad && lon === circles_on_map[j].lon && lat === circles_on_map[j].lat) {
            isPresent = true;
          }
        }
        if (isPresent === false) { // if circle not present in map layers
          this.test_drawnCircles.splice(i, 1);
          for (let k = this.drawnCircles.length - 1; k >= 0; k--) {
            if (rad === this.drawnCircles[k].rad && lon === this.drawnCircles[k].lon && lat === this.drawnCircles[k].lat) {
              this.drawnCircles.splice(k, 1);
              console.log('drawn circles = ' + this.drawnCircles);
            }
          }

        }
      }
      console.log(this.drawnCircles);
      console.log('IN FIRST CONDITION')
    } else { // if circle or marker are deleted in list!
      // console.log('In deleteMarker() + ' + marker.semantic_name);
      // console.log(this.test_markers.hasOwnProperty('semantic_name'))

      if (marker.semantic_name !== '') { // if a location-tag is deleted
        for (let i = this.test_markers.length - 1; i >= 0; i--) {
          if (this.test_markers[i].hasOwnProperty(marker.semantic_name)) {
            console.log('here');
            this.popUpMap.removeLayer(this.test_markers[i][marker.semantic_name][1]);
            delete this.test_markers[marker.semantic_name];
            this.test_markers.splice(i, 1);
          }
        }
      } else if (marker.semantic_name === '') { // if a circle-tag is deleted
        const rad = marker.rad, lon = marker.lon, lat = marker.lat;
        for (let i = this.test_drawnCircles.length - 1; i >= 0; i--) { // check rad, lon, lat
          if (rad === this.test_drawnCircles[i][0] && lon === this.test_drawnCircles[i][1] && lat === this.test_drawnCircles[i][2]) {
            this.popUpMap.removeLayer(this.test_drawnCircles[i][3]);
            this.test_drawnCircles.splice(i, 1);
          }
        }
      }
      console.log('IN SECOND CONDITION')
    }
  }

  ngOnInit(): void {
    this.initMap();
  }

  /*  public removeLocation(i) {
      this.locations.splice(i, 1);
    }*/

  /**
   * Closes the dialog.
   */
  public close() {
    const filterCoordinates: Circle[] = [];
    this.popUpMap.eachLayer(function (layer) {
      if (layer instanceof L.Circle) {
        const circle: Circle = {
          type: 'circle',
          semantic_name: '',
          lon: layer.getLatLng().lng,
          lat: layer.getLatLng().lat,
          rad: layer.getRadius()
        }
        filterCoordinates.push(circle);
      }
    });

    const markersAsCircles = []

    for (let i = this.test_markers.length - 1; i >= 0; i--) {
      console.log('here');
      if (Object.keys(this.test_markers[i]).length === 1) {
        const key = Object.keys(this.test_markers[i]);
        markersAsCircles.push(this.test_markers[i][key.toString()][0])
      }
    }

    this.mapState = filterCoordinates.concat(markersAsCircles); // markers + drawn circles
    console.log('mapState right before closing popup');
    this.mapState.forEach(elem => {
      if (elem) {
        console.log(elem.type);
      }
    });
    this._dialogRef.close(this.mapState);
  }

  get field() {
    return this._field;
  }

  /**
   * Invoked whenever the user selects a location from the list.
   *
   * @param {MatAutocompleteSelectedEvent} event The selection event.
   */
  public onLocationSelected(event: MatAutocompleteSelectedEvent) {
    let locationAlreadyInList = false;
    for (const existing of this.test_markers) {
      // event.option.value is one chosen dictionary in autocomplete list.
      // Here, we choose by indicating key, we get the value such as work, home, Dublin etc.
      if (existing.hasOwnProperty(event.option.value['semantic_name'])) {
        locationAlreadyInList = true;
      }
    }
    // console.log(locationAlreadyInList);
    if (!locationAlreadyInList) {
      const circle: Circle = {
        type: 'info',
        semantic_name: event.option.value['semantic_name'], // object {semantic_name, lon, lat, freq}
        lon: event.option.value['lon'],
        lat: event.option.value['lat'],
      }
      this.addLocation(circle); // add object {semantic_name, lon, lat, freq}
    } else {
      this.field.formControl.setValue('');
      this._matsnackbar.open(`Location ${event.option.value['semantic_name']} already added`, null, {
        duration: 2000,
      });
    }
  }

  /**
   * Add the specified tag to the list of tags.
   *
   * @param {Tag} tag The tag that should be added.
   */
  public addLocation(location: Circle) {
    this.markers.push(location); // add new location as tag
    this.updateMarkers(location); // add new location as marker in map
    this.field.formControl.setValue('');
  }

  /**
   * Removes the specified tag from the list of tags.
   *
   * @param {Tag} tag The tag that should be removed.
   */
  public removeLocation(location: Circle) {
    if (location.semantic_name !== '') { // marker is deleted by removing tag
      const index = this.markers.indexOf(location);
      if (index > -1) {
        this.markers.splice(index, 1);
        this.deleteMarker(location);

        // console.log(this.test_markers.hasOwnProperty(location.semantic_name))
        // delete this.test_markers[location.semantic_name];
      }
    } else if (location.semantic_name === '') { // circle is deleted by removing tag
      const index = this.drawnCircles.indexOf(location);
      if (index > -1) {
        this.drawnCircles.splice(index, 1);
        this.deleteMarker(location);
      }
    }
  }

  get taggedLocations() {
    return this.markers;
  }

  get allDrawnCircles() {
    return this.drawnCircles;
  }
}


/**
 * Groups the FormControl and the data source Observable of a specific location field.
 */
export class FieldGroup {
  /** The FormControl used to control the location field. */
  public readonly formControl: FormControl = new FormControl();

  /** The Observable that acts as data source for the field. */
  public readonly filteredLocations: Observable<Array<{ [key: string]: string; }>>;
  public currentlyDisplayedLocations: Array<string> = new Array<string>();

  /** The currently selected location. */
  private _selection: Circle;

  constructor(private _locations: MapLookupService) {
    this.filteredLocations = this.formControl.valueChanges.pipe(
      debounceTime(250),
      startWith(''),
      map((location: string) => {
        if (location.length >= 2) {
          return this._locations.getDistinctLocations().pipe(first()).map(res => res.columns.filter(row =>
              location.toLowerCase().split(' ').every(r => row['semantic_name'].toLowerCase().split(' ').find(a => a.indexOf(r) > -1))
            // row['semantic_name'].toLowerCase().split(' ').some(e => e.indexOf())
            )
          );
        } else {
          return EMPTY;
        }
      }),
      mergeAll()
    );
    this.filteredLocations.subscribe(value => {
      this.currentlyDisplayedLocations = new Array<string>();
      value.forEach(t => this.currentlyDisplayedLocations.push(t['semantic_name']));
    });
  }

  get selection(): Circle {
    return this._selection;
  }

  set selection(value: Circle) {
    this._selection = value;
  }
}


