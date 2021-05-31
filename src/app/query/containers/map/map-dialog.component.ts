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
const iconDefault = L.icon({iconRetinaUrl, iconUrl, shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]});
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

  /** List of tag fields currently displayed. */
  private readonly _field: FieldGroup;

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
    // this.mapState = this.data.mapState;
    const colorOptions = {
      color: 'red',
      fillColor: '#f03',
      fillOpacity: 0
    }
    this.data.mapState.forEach((circle) => {
      if (circle.type === 'circle') {
        const newCircle = L.circle([circle.lat, circle.lon], circle.rad, colorOptions);
        newCircle.addTo(this.popUpMap);
        items.push(newCircle);
      } else if (circle.type === 'info') {
        console.log('IN INIT MAP popup')
        // draw Marker!
        const marker = L.marker([ circle.lat, circle.lon ]);
        marker.addTo(this.popUpMap).bindPopup(circle.semantic_name);
        items.push(marker);
        this.markers.push(circle);
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
      }
    });
  }

  public updateMap() {
    this.popUpMap.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) {
        layer.remove();
      }
    });
    const colorOptions = {
      color: 'red',
      fillColor: '#f03',
      fillOpacity: 0
    }
    this.mapState = this.markers.concat(this.drawnCircles);
    this.mapState.forEach( (res) => {
      if (res.type === 'circle') { // other case when res[0]==='info'. This comes from MapTag
        const circle = L.circle([res.lat, res.lon], res.rad, colorOptions);
        circle.addTo(this.popUpMap);
      } else if (res.type === 'info') {
        // draw MARKER!
        // const circle = L.circle([res.lat, res.lon], res.rad, colorOptions);
        const marker = L.marker([res.lat, res.lon], colorOptions);
        marker.addTo(this.popUpMap).bindPopup(res.semantic_name);
        marker.addTo(this.popUpMap);
      }
    });
  }

  // tslint:disable-next-line:max-line-length
  constructor(private _mapService: MapLookupService, private _dialog: MatDialog, private _matsnackbar: MatSnackBar, private _dialogRef: MatDialogRef<MapDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: { mapState: Circle[] }) {
    this._field = new FieldGroup(_mapService);
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
      }});
    this.mapState = filterCoordinates.concat(this.markers); // markers + drawn circles
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
    for (const existing of this.mapState) {
      // event.option.value is one chosen dictionary in autocomplete list.
      // Here, we choose by indicating key, we get the value such as work, home, Dublin etc.
      if (existing.semantic_name === event.option.value['semantic_name']) {
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
    // this.mapState.push(circle);
    // this.locations.push(location); // maybe not needed in the end
    this.markers.push(location);
    this.updateMap();
    this.field.formControl.setValue('');
    // console.log(this.locations);
    // console.log(this._field.filteredLocations);
    // console.log(this._field.currentlyDisplayedLocations);
  }

/*  /!**
   * Removes the specified tag from the list of tags.
   *
   * @param {Tag} tag The tag that should be removed.
   *!/
  public removeTag(tag: Tag) {
    const index = this._tags.indexOf(tag);
    if (index > -1) {
      this._tags.splice(index, 1);
    }
    this.tagTerm.tags = this._tags;
    this.tagTerm.data = 'data:application/json;base64,' + btoa(JSON.stringify(this._tags.map(v => {
      return v;
    })));
  }*/
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
        if (location.length >= 3) {
          return this._locations.getDistinctLocations().pipe(first()).map(res => res.columns)
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


