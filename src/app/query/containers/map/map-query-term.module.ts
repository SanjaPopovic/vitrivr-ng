import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {MaterialModule} from '../../../material.module';
import {SketchModule} from '../../../shared/components/sketch/sketch.module';
import {MapQueryTermComponent} from './map-query-term.component';

@NgModule({
  imports: [MaterialModule, BrowserModule, FormsModule, ReactiveFormsModule, SketchModule],
  declarations: [MapQueryTermComponent],
  exports: [MapQueryTermComponent],
})

export class MapQueryTermModule {
}
