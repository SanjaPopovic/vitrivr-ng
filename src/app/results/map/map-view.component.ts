import {AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component} from '@angular/core';
import {MediaObjectScoreContainer} from '../../shared/model/results/scores/media-object-score-container.model';
import {MediaSegmentScoreContainer} from '../../shared/model/results/scores/segment-score-container.model';
import {EMPTY, Observable} from 'rxjs';
import {ResultsContainer} from '../../shared/model/results/scores/results-container.model';
import {AbstractSegmentResultsViewComponent} from '../abstract-segment-results-view.component';
import {QueryChange, QueryService} from '../../core/queries/query.service';
import {SelectionService} from '../../core/selection/selection.service';
import {FilterService} from '../../core/queries/filter.service';
import {EventBusService} from '../../core/basics/event-bus.service';
import {Router} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ResolverService} from '../../core/basics/resolver.service';
import {MatDialog} from '@angular/material/dialog';
import {AppConfig} from '../../app.config';
import * as L from 'leaflet';
import {LabelType, Options} from '@angular-slider/ngx-slider';
import {Circle} from '../../query/containers/map/circle';

@Component({

  selector: 'app-map-view',
  templateUrl: 'map-view.component.html',
  styleUrls: ['map-view.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapViewComponent extends AbstractSegmentResultsViewComponent<MediaObjectScoreContainer[]> implements AfterViewInit {

  /** Name of this MapViewComponent. */
  protected name = 'map-view';

  private map;
  private markers = [];
  public chosenDate: Date;

  public dates: Date[];
  public value = 0;
  options: Options = {
    floor: 0,
    ceil: 100,
    showTicks: true,
    tickStep: 10
  };

  public sliderOptions() {
    if (this.dates.length > 0) {
      this.options = {
        stepsArray: this.dates.map((date: Date) => {
          return {value: date.getTime()};
        }),
        translate: (value: number, label: LabelType): string => {
          return new Date(value).toDateString();
        }
      };
    }
  }

  public getInitPosition() {
    if (this.dates.length > 0) {
      this.value = this.dates[0].getTime();
    }
  }

  public currentDate(event?: number) {
    if (event) {
      this.chosenDate = new Date(event);
      console.log('first condition');
      this._dataSource.forEach((val => {
        this.updateMap(val)
      }))
    } else {
      if (this.dates.length > 0) {
        this.chosenDate = this.dates[0];
        console.log('second cond.');
      }
    }
  }

  constructor(_cdr: ChangeDetectorRef,
              _queryService: QueryService,
              _filterService: FilterService,
              _selectionService: SelectionService,
              _eventBusService: EventBusService,
              _configService: AppConfig,
              _router: Router,
              _snackBar: MatSnackBar,
              _resolver: ResolverService,
              _dialog: MatDialog
  ) {
    super(_cdr, _queryService, _filterService, _selectionService, _eventBusService, _router, _snackBar, _configService, _resolver, _dialog);
    this._count = this.scrollIncrement() * 5;
  }

  ngAfterViewInit(): void {
    this.initMap();
    this._dataSource.forEach(val => this.updateMap(val)); // when results found, but switched to map view from another view
  }

  private initMap(): void {
    this.map = L.map('map', {
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

  public updateMap(results: MediaObjectScoreContainer[]) {
    this.map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) {
        layer.remove();
      }
    });
    this.markers = [];
    let resultContainer: MediaObjectScoreContainer;
    if (this.test(this.chosenDate, results)) {
      const mediaObjScoreContainer_packed = this.getMediaObj(this.chosenDate, results);
      if (mediaObjScoreContainer_packed.length === 1) {
        resultContainer = mediaObjScoreContainer_packed[0];
        const colorOptions = {
          color: 'red',
          fillColor: '#f03',
          fillOpacity: 0
        }
        resultContainer.segments.forEach(segment => {
          if (segment.metadata.get('LOCATION.lat') && segment.metadata.get('LOCATION.lon')) {
            this.markers.push(L.marker([segment.metadata.get('LOCATION.lat'), segment.metadata.get('LOCATION.lon')], colorOptions))
          }
        });
      }
    }
    if (resultContainer) {
      console.log('markers = ' + this.markers.length);
      console.log('size of results per day = ' + resultContainer.segments.length);
    }
    for (const marker of this.markers) {
      marker.addTo(this.map);
    }
  }

  public test(value: Date, list: MediaObjectScoreContainer[]): boolean {
    for (const m of list) {
      if (m.date.valueOf() === value.valueOf()) {
        // console.log(m.date.valueOf() + ' ' + value.valueOf())
        return true;
      }
    }
    return false;
  }

  public getMediaObj(value: Date, list: MediaObjectScoreContainer[]): MediaObjectScoreContainer[] {
    for (const m of list) {
      if (m.date.valueOf() === value.valueOf()) {
        return [m];
      }
    }
    return [];
  }

  /**
   * Getter for the filters that should be applied to SegmentScoreContainer.
   */
  get objectFilter(): Observable<((v: MediaObjectScoreContainer) => boolean)[]> {
    return this._filterService.objectFilters;
  }

  /**
   * Getter for the filters that should be applied to SegmentScoreContainer.
   */
  get segmentFilter(): Observable<((v: MediaSegmentScoreContainer) => boolean)[]> {
    return this._filterService.segmentFilter;
  }

  /**
   * This is a helper method to facilitate updating the the list correct. It is necessary due to nesting in the template (two NgFor). To determine, whether to update the view,
   * angular only takes the outer observable into account. As long as this observable doesn't change, there is now update. Doe to the hierarchical nature of the data, it is -
   * however - entirely possible that the outer observable is not changed while segments are being added to the container.
   *
   * This function created a unique identifier per MediaObjectScoreContainer which takes the number of segments into account.
   *
   * @param index
   * @param {MediaObjectScoreContainer} item
   */
  public trackByFunction(index, item: MediaObjectScoreContainer) {
    return item.objectId + '_' + item.numberOfSegments;
  }

  public segmentTracking(index, item: MediaSegmentScoreContainer) {
    return item.segmentId
  }

  scrollIncrement(): number {
    return 100;
  }

  /**
   * Subscribes to the data exposed by the ResultsContainer.
   *
   * @return {Observable<MediaObjectScoreContainer>}
   */
  protected subscribe(results: ResultsContainer) {
    if (results) {
      this._dataSource = results.mediaobjectsAsObservable;
      this._dataSource.subscribe(val => {
        this.dates = val.map(v => new Date(v.path)).sort((a: Date, b: Date) => a.valueOf() - b.valueOf());
        this.sliderOptions();
        this.getInitPosition();
        this.currentDate();
      });
    }
  }

  protected removeItemsFromMap() {
    this.markers = [];
    this.map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) {
        layer.remove();
      }
    });
  }

  getSliderValue(event) {
    console.log(event.target.value);
  }

  /**
   * Invoked whenever the QueryService reports that the results were updated. Causes
   * the gallery to be re-rendered.
   *
   * @param msg QueryChange message
   */
  protected onQueryStateChange(msg: QueryChange) {
    switch (msg) {
      case 'STARTED':
        this.setLoading(true);
        this.subscribe(this._queryService.results);
        this._dataSource.forEach(val => this.updateMap(val));
        break;
      case 'ENDED':
      case 'ERROR':
        this.setLoading(false);
        break;
      case 'CLEAR':
        this._dataSource = EMPTY;
        this.removeItemsFromMap();
        break;
    }
    this._cdr.markForCheck();
  }
}
