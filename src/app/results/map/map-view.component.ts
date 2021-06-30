import {AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output} from '@angular/core';
import {MediaObjectScoreContainer} from '../../shared/model/results/scores/media-object-score-container.model';
import {MediaSegmentScoreContainer} from '../../shared/model/results/scores/segment-score-container.model';
import {Observable} from 'rxjs';
import {ResultsContainer} from '../../shared/model/results/scores/results-container.model';
import {AbstractSegmentResultsViewComponent} from '../abstract-segment-results-view.component';
import {QueryService} from '../../core/queries/query.service';
import {SelectionService} from '../../core/selection/selection.service';
import {FilterService} from '../../core/queries/filter.service';
import {EventBusService} from '../../core/basics/event-bus.service';
import {Router} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ResolverService} from '../../core/basics/resolver.service';
import {MatDialog} from '@angular/material/dialog';
import {VbsSubmissionService} from '../../core/vbs/vbs-submission.service';
import {AppConfig} from '../../app.config';
import {StageChangeEvent} from '../../query/containers/stage-change-event.model';
import * as L from 'leaflet';

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
    }
  }
}
