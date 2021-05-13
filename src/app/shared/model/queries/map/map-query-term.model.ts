import {AbstractQueryTerm} from '../abstract-query-term.model';
import {QueryTerm} from '../../../../../../openapi/cineast/model/queryTerm';


export class MapQueryTerm extends AbstractQueryTerm {

  constructor() {
    super(QueryTerm.TypeEnum.MAP, ['map']);
  }
}
