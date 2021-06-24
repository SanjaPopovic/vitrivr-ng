import {AbstractQueryTerm} from '../abstract-query-term.model';
import {QueryTerm} from '../../../../../../openapi/cineast';
import {Circle} from '../../../../query/containers/map/circle';


export class MapQueryTerm extends AbstractQueryTerm {

  private data_as_Circles: Circle[] = [];

  constructor() {
    super(QueryTerm.TypeEnum.MAP, ['map']);
  }

  setData(data: Circle[]) {
    this.data_as_Circles = data;
  }

  getData() {
    return this.data_as_Circles;
  }
}
