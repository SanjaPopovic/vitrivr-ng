import {Component, HostListener, OnInit, QueryList, ViewChildren} from '@angular/core';
import {QueryService} from '../core/queries/query.service';
import {QueryContainerInterface} from '../shared/model/queries/interfaces/query-container.interface';
import {StagedQueryContainer} from '../shared/model/queries/staged-query-container.model';
import {EventBusService} from '../core/basics/event-bus.service';
import {ContextKey, InteractionEventComponent} from '../shared/model/events/interaction-event-component.model';
import {InteractionEventType} from '../shared/model/events/interaction-event-type.model';
import {InteractionEvent} from '../shared/model/events/interaction-event.model';
import {from} from 'rxjs';
import {bufferCount, flatMap, map} from 'rxjs/operators';
import {FilterService} from '../core/queries/filter.service';
import {QueryContainerComponent} from './containers/query-container.component';
import {TemporalFusionFunction} from '../shared/model/results/fusion/temporal-fusion-function.model';
import {CdkDragDrop, moveItemInArray, transferArrayItem} from '@angular/cdk/drag-drop';
import {TagQueryTerm} from '../shared/model/queries/tag-query-term.model';
import {BoolQueryTerm} from '../shared/model/queries/bool-query-term.model';
import {TextQueryTerm} from '../shared/model/queries/text-query-term.model';


@Component({

  selector: 'app-query-sidebar',
  templateUrl: 'query-sidebar.component.html'
})
export class QuerySidebarComponent implements OnInit {
  /** StagedQueryContainer's held by the current instance of ResearchComponent. */
  public readonly containers: QueryContainerInterface[] = [];
  @ViewChildren(QueryContainerComponent) queryContainers: QueryList<QueryContainerComponent>;
  /** A timestamp used to store the timestamp of the last Enter-hit by the user. Required for shortcut detection. */
  private _lastEnter: number = 0;

  constructor(private _queryService: QueryService, private _filterService: FilterService, private _eventBus: EventBusService) {
  }

  /**
   * Lifecycle Callback (OnInit): Adds a new QueryTermContainer.
   */
  public ngOnInit() {
    this.addQueryTermContainer();
  }

  /**
   * Adds a new StagedQueryContainer to the list of QueryContainers.
   */
  public addQueryTermContainer() {
    this.containers.push(new StagedQueryContainer());
  }

  /**
   * Triggers the similarity onSearchClicked by packing all configured QueryContainers into a single
   * SimilarityQuery message, and submitting that message to the QueryService.
   *
   * FYI: context is only part of logging for VBS, not part of message sent to cineast
   */
  public onSearchClicked() {
    if (this.queryContainers && this.queryContainers.length >= 2) {
      const tempDist = this.getTemporalDistance();
      if (tempDist) {
        TemporalFusionFunction.instance().setTemporalDistance(tempDist);
      }
    }

    this._queryService.findSimilar(this.containers);
    const _components: InteractionEventComponent[] = []
    this.containers.forEach(container => {
      _components.push(new InteractionEventComponent(InteractionEventType.NEW_QUERY_CONTAINER))
      container.stages.forEach(s => {
        _components.push(new InteractionEventComponent(InteractionEventType.NEW_QUERY_STAGE))
        s.terms.forEach(t => {
          const context: Map<ContextKey, any> = new Map();
          context.set('q:categories', t.categories);
          context.set('q:value', 'null')
          switch (t.type) {
            case 'IMAGE':
              _components.push(new InteractionEventComponent(InteractionEventType.QUERY_IMAGE, context));
              return;
            case 'AUDIO':
              _components.push(new InteractionEventComponent(InteractionEventType.QUERY_AUDIO, context));
              return;
            case 'MOTION':
              _components.push(new InteractionEventComponent(InteractionEventType.QUERY_MOTION, context));
              return;
            case 'MODEL3D':
              _components.push(new InteractionEventComponent(InteractionEventType.QUERY_MODEL3D, context));
              return;
            case 'SEMANTIC':
              _components.push(new InteractionEventComponent(InteractionEventType.QUERY_SEMANTIC, context));
              return;
            case 'TEXT':
              context.set('q:value', (t as TextQueryTerm).data); // data = plaintext
              _components.push(new InteractionEventComponent(InteractionEventType.QUERY_FULLTEXT, context));
              return;
            case 'BOOLEAN':
              context.set('q:value', (t as BoolQueryTerm).terms)
              _components.push(new InteractionEventComponent(InteractionEventType.QUERY_BOOLEAN, context));
              return;
            case 'TAG':
              context.set('q:value', (t as TagQueryTerm).tags);
              _components.push(new InteractionEventComponent(InteractionEventType.QUERY_TAG, context));
              return;
          }
        })
      })
    });
    this._eventBus.publish(new InteractionEvent(..._components))
  }

  /**
   * Clears all results and resets query terms.
   */
  public onClearAllClicked() {
    this._queryService.clear();
    this._filterService.clear();
    this.containers.length = 0;
    this.addQueryTermContainer();
    this._eventBus.publish(new InteractionEvent(new InteractionEventComponent(InteractionEventType.CLEAR)));
  }

  /**
   * Detects certain key combinations and takes appropriate action.
   *
   * @param {KeyboardEvent} event
   */
  @HostListener('window:keyup', ['$event'])
  public keyEvent(event: KeyboardEvent) {
    /** Detects a double-enter, which will trigger a new search. */
    if (event.keyCode === 13) {
      let timestamp = Date.now();
      if (timestamp - this._lastEnter < 1000) {
        this.onSearchClicked();
        this._lastEnter = 0;
      } else {
        this._lastEnter = timestamp;
      }
    }

    /** F1 will trigger a search. */
    if (event.keyCode == 112) {
      this.onSearchClicked();
    }

    /** F2 will reset the search. */
    if (event.keyCode == 113) {
      this.onClearAllClicked();
    }
  }

  /**
   * To traverse the dom tree with @viewchildren, all the children need the annotation (i.e. decorator)
   */
  private getTemporalDistance() {
    if (this.queryContainers && this.queryContainers.length >= 2) {
      const second = this.queryContainers.toArray()[1] as QueryContainerComponent;
      if (second.temporalDistances && second.temporalDistances.length >= 1) {
        const temporalDistanceComponent = second.temporalDistances.first;
        if (temporalDistanceComponent) {
          return temporalDistanceComponent.getTemporalDistanceFromUser();
        }
      }
    }
    return null;
  }
}
