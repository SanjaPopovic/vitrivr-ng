import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {SemanticQueryTerm} from '../../../shared/model/queries/semantic/semantic-query-term.model';
import {MapQueryTermModel} from '../../../shared/model/queries/map/map-query-term.model';

@Component({
  selector: 'app-qt-map',
  templateUrl: 'map-query-term.component.html',
  styleUrls: ['map-query-term.component.css']
})
export class MapQueryTermComponent implements OnInit {
  /** Component used to display a preview of the selected AND/OR sketched image. MAP here*/
  @ViewChild('previewimgMap', {static: true})

  private previewingMap: any;
  /** The SemanticQueryTerm object associated with this SemanticQueryTermComponent. That object holds all the query-settings. */
  @Input()
  private mapTerm: MapQueryTermModel;

  constructor() {
  }

  ngOnInit(): void {
  }


}
