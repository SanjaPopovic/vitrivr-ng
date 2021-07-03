import {Pipe, PipeTransform} from '@angular/core';
import {ScoreContainer} from '../../model/results/scores/compound-score-container.model';
import {MediaObjectScoreContainer} from '../../model/results/scores/media-object-score-container.model';

@Pipe({
  name: 'OrderByDatePipe'
})
export class OrderByDatePipe implements PipeTransform {

  /**
   * Returns the provided array of ScoreContainer sorted score in either ascending or descending order.
   *
   * @param {Array<ScoreContainer>} array
   * @param {string} desc
   * @return {Array<ScoreContainer>}
   */
  public transform<T extends MediaObjectScoreContainer>(array: Array<T>): Array<T> {
    if (!array || array.length === 0) {
      return [];
    }
    return array.sort((a: MediaObjectScoreContainer, b: MediaObjectScoreContainer) => new Date(a.path).valueOf() - new Date(b.path).valueOf());
  }
}
