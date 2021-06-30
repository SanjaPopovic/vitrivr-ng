import {NgModule} from '@angular/core';
import {ListModule} from './list/list.module';
import {GalleryModule} from './gallery/gallery.module';
import {FeatureDetailsComponent} from './feature-details.component';
import {BrowserModule} from '@angular/platform-browser';
import {HistoryComponent} from './history.component';
import {MaterialModule} from '../material.module';
import {TemporalListModule} from './temporal/temporal-list.module';
import {VgCoreModule} from '@videogular/ngx-videogular/core';
import {MapViewModule} from './map/map-view.module';
import {MapViewComponent} from './map/map-view.component';

@NgModule({
  imports: [GalleryModule, ListModule, TemporalListModule, MapViewModule, BrowserModule, MaterialModule, VgCoreModule],
  declarations: [FeatureDetailsComponent, HistoryComponent],
  exports: [GalleryModule, ListModule, TemporalListModule, MapViewModule],
})
export class ResultsModule {
}
