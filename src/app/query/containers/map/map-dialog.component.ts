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


@Component({
  selector: 'app-qt-map-dialog',
  templateUrl: 'map-dialog.component.html',
  styleUrls: ['./map-dialog.component.css']
})
export class MapDialogComponent implements OnInit {
  private popUpMap;
  private mapState: Circle[] = [];
  locations = [];
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
        const marker = L.marker([circle.lat, circle.lon], colorOptions);
        marker.addTo(this.popUpMap);
        items.push(marker);
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

  constructor(private _mapService: MapLookupService, private _dialog: MatDialog, private _matsnackbar: MatSnackBar, private _dialogRef: MatDialogRef<MapDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: { mapState: Circle[] }) {
    this._field = new FieldGroup(_mapService);
  }

  ngOnInit(): void {
    this.initMap();
  }

/*  public addLocation() {
    this.locations.push({location: ''}); // new word
    const columns: Observable<SelectResult> = this._mapService.getDistinctLocations();
    console.log(columns.forEach(value => {console.log(value.columns)}));
  }*/

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
        console.log('check layer');
        const circle: Circle = {
          type: 'circle',
          semantic_name: '',
          lon: layer.getLatLng().lng,
          lat: layer.getLatLng().lat,
          rad: layer.getRadius(),
        }
        filterCoordinates.push(circle);
      } else if (layer instanceof L.marker) {
        const circle: Circle = {
          type: 'info',
          semantic_name: '',
          lon: layer.getLatLng().lng,
          lat: layer.getLatLng().lat,
          rad: layer.getRadius(),
        }
      }
    });
    console.log(filterCoordinates);
    this._dialogRef.close(filterCoordinates);
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
    this.locations.push(location); // push ob
    this.mapState.push(location);
    this.field.formControl.setValue('');
    console.log(this.locations);
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
          // const temp: Observable<string[]> = new Observable<string[]>();
          return this._locations.getDistinctLocations().pipe(first()).map(res => res.columns) // .pipe(first()).map(r => r.map((dict) => temp.push(dict['semantic_name'])));
          // console.log(temp); // this._locations.getDistinctLocations().pipe(first()).map(res => res.columns[0]['semantic_name']))
          // return temp; // .map(res => res.columns); // .pipe().map(r => r.forEach((dict) => {dict}));
        } else {
          return EMPTY;
        }
      }),
      mergeAll()
    );
    this.filteredLocations.subscribe(value => {
      this.currentlyDisplayedLocations = new Array<string>();
      value.forEach(t => this.currentlyDisplayedLocations.push(t['semantic_name']));
      // console.log(this.currentlyDisplayedLocations);
    });
  }

  get selection(): Circle {
    return this._selection;
  }

  set selection(value: Circle) {
    this._selection = value;
  }
}


