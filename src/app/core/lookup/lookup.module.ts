import {NgModule} from '@angular/core';
import {HttpClientModule} from '@angular/common/http';
import {DistinctElementLookupService} from './distinct-element-lookup.service';
import {MapLookupService} from './map-lookup.service';

@NgModule({
  imports: [HttpClientModule],
  declarations: [],
  providers: [DistinctElementLookupService, MapLookupService]
})

export class LookupModule {
}
