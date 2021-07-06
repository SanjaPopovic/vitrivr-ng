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
import {Tag} from '../../core/selection/tag.model';
import {ColorUtil} from '../../shared/util/color.util';

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
  private segments_with_popups: MediaSegmentScoreContainer[];
  private clusters_clicked = [];
  private clusters = [];
  private distinct_latlngs = [];
  private markers = [];
  private clusters_markers = [];
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
      // console.log('first condition');
      this._dataSource.forEach((val => {
        this.updateMap(val)
      }))
    } else {
      if (this.dates.length > 0) {
        this.chosenDate = this.dates[0];
        // console.log('second cond.');
      }
    }
  }

  setChosenMarker(event: MediaSegmentScoreContainer) {
    if (this.segments_with_popups.length === 0) {
      const idx = this.segments_with_popups.findIndex(segment => segment === event);
      if (idx < 0) {
        // update marker with popup
        const cluster_id = this.clusters.findIndex(row => row.findIndex(elem => elem.segmentId === event.segmentId) > -1);
        // console.log(this.clusters);
        // console.log('index = ' + cluster_id);
        let marker_to_change;
        if (cluster_id > -1) {
          const found_cluster = this.clusters_markers.find(({clusterID}) => clusterID === cluster_id);
          if (found_cluster !== undefined) {
            // console.log(found_cluster['markerID'])
            marker_to_change = this.markers.find(marker => marker._leaflet_id === found_cluster['markerID'])
            const popup = L.popup({'autoClose': false, 'closeOnClick': false, 'closePopupOnClick': false}).setContent('Location of selected image.');
            marker_to_change.bindPopup(popup).openPopup();
            this.segments_with_popups.push(event);
            const _this = this;
            marker_to_change.getPopup().on('remove', function (e) {
              // console.log(e)
              marker_to_change.unbindPopup()
              const index = _this.segments_with_popups.findIndex(segment => segment === event);
              // console.log(index)
              if (index === 0) {
                _this.segments_with_popups.splice(index, 1);
              }
            });
          }
        }
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
    this.clusters_markers = [];
    this.distinct_latlngs = [];
    this.clusters = [];
    this.clusters_clicked = []
    this.segments_with_popups = [];
    let resultContainer: MediaObjectScoreContainer;
    if (this.test(this.chosenDate, results)) {
      const mediaObjScoreContainer_packed = this.getMediaObj(this.chosenDate, results);
      if (mediaObjScoreContainer_packed.length === 1) {
        resultContainer = mediaObjScoreContainer_packed[0];
        const _this = this;
        resultContainer.segments.forEach(segment => {
          if (segment.metadata.get('LOCATION.lat') && segment.metadata.get('LOCATION.lon')) {
            const index = this.distinct_latlngs.findIndex(latlng => latlng[0] === segment.metadataForKey('LOCATION.lat') && latlng[1] === segment.metadataForKey('LOCATION.lon'));
            if (index > -1) {
              // console.log(index)
              this.clusters[index].push(segment);
            } else {
              this.distinct_latlngs.push([segment.metadataForKey('LOCATION.lat'), segment.metadataForKey('LOCATION.lon')]);
              this.clusters.push([segment]);
              this.clusters_clicked.push(false);
            }
          }
        });
        // console.log('LOOK HERE')
        // console.log(this.distinct_latlngs);
        // console.log(this.clusters);
        for (let i = 0; i < this.clusters.length; i++) {
          const latlngs = this.distinct_latlngs[i];
          const newMarker = L.marker([latlngs[0], latlngs[1]]).addTo(this.map);
          this.markers.push(newMarker);
          this.clusters_markers.push({clusterID: i, markerID: newMarker._leaflet_id});
          newMarker.on('click', function (e) {
            if (_this.clusters_markers) {
              const found_cluster = _this.clusters_markers.find(({markerID}) => markerID === e.sourceTarget._leaflet_id);
              // console.log('found cluster id:')
              /*console.log(found_cluster['clusterID']);
              console.log(_this.clusters_markers[found_cluster['clusterID']]);*/
              // console.log(_this.clusters[found_cluster['clusterID']]);
              // console.log(_this.clusters_markers[found_cluster['clusterID']]);
              if (_this.clusters_clicked[found_cluster['clusterID']]) {
                _this.clusters_clicked[found_cluster['clusterID']] = false;
                for (const seg of _this.clusters[found_cluster['clusterID']]) { // go through all segments ids that are in this cluster
                  document.getElementById(seg.segmentId).style.backgroundColor = _this.backgroundForSegment(seg);
                }
              } else {
                _this.clusters_clicked[found_cluster['clusterID']] = true;
                for (const seg of _this.clusters[found_cluster['clusterID']]) { // go through all segments ids that are in this cluster
                  document.getElementById(seg.segmentId).style.backgroundColor = _this.temporaryBackgroundForSegment(seg);
                }
              }
            }
          });
        }
      }
    }
    if (resultContainer) {
      // console.log('markers = ' + this.markers.length);
      // console.log('size of results per day = ' + resultContainer.segments.length);
    }
    // console.log(this.clusters_markers);
    for (const marker of this.markers) {
      // marker.addTo(this.map);
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
    this.clusters_markers = [];
    this.clusters = [];
    this.distinct_latlngs = [];
    this.clusters_clicked = [];
    this.segments_with_popups = [];
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

  public temporaryBackgroundForSegment(segment: MediaSegmentScoreContainer): string {
    const score = segment.score;
    return this.temporaryBackgroundForScore(score, segment);
  }

  public temporaryBackgroundForScore(score: number, segment: MediaSegmentScoreContainer): string {
    const tags: Tag[] = this._selectionService.getTags(segment.segmentId);
    if (tags.length === 0) {
      const v = Math.round(255.0 - (score * 255.0));
      return ColorUtil.rgbToHex(255, 0, 0); // ColorUtil.rgbToHex(255, v, v);
    }
  }
}
