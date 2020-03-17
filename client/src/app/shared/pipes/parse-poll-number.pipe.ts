import { Pipe, PipeTransform } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { VOTE_MAJORITY, VOTE_UNDOCUMENTED } from '../models/poll/base-poll';

@Pipe({
    name: 'parsePollNumber'
})
export class ParsePollNumberPipe implements PipeTransform {
    public constructor(private translate: TranslateService) {}

    public transform(value: number): number | string {
        const input = Math.trunc(value);
        switch (input) {
            case VOTE_MAJORITY:
                return this.translate.instant('majority');
            case VOTE_UNDOCUMENTED:
                return this.translate.instant('undocumented');
            default:
                return input;
        }
    }
}
