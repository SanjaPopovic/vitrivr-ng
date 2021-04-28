import {AbstractQueryTerm} from '../abstract-query-term.model';
import {QueryTerm} from '../../../../../../openapi/cineast/model/queryTerm';



export class MapQueryTerm extends AbstractQueryTerm {

  /** The image data associated with this SemanticQueryTerm. MAP INSTEAD OF IMAGE*/
  private _image: string;

  constructor() {
    super(QueryTerm.TypeEnum.MAP, ['map']); /**to change to map*/
  }

  /**
   * Getter for image. MAP
   */
  get image(): string {
    return this._image;
  }

  /**
   * Setter for image. MAP
   */
  set image(value: string) {
    this._image = value;
    // this.refresh();
  }

}
