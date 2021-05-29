import {Inject, Injectable} from '@angular/core';
import {Observable, BehaviorSubject} from 'rxjs';
import {first} from 'rxjs/operators';
import {MiscService, SelectResult} from '../../../../openapi/cineast';
import {SelectSpecification} from '../../../../openapi/cineast';

/**
 * This service provides access to the <Semantic_name, lon, lat, freq> table stored and exposed by Cineast through the Cineast RESTful API.
 *
 * This is a proxy service since it applies basic caching mechanism.
 */
@Injectable()
export class MapLookupService {

  constructor(@Inject(MiscService) private _miscService: MiscService) {
  }

  /**
   * Returns all visited locations in lifelog (LSC).
   */
  public getDistinctLocations(): Observable<SelectResult> {
    const sp: SelectSpecification = {
      table: 'cineast_distinctlocations',
      columns: ['semantic_name', 'lat', 'lon', 'freq']
    };
    return this._miscService.selectFromTable(sp).pipe(first()).map(res => {
      return res // look at selectResult.ts
    });
  }
}
