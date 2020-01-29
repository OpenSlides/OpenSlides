import { Pipe, PipeTransform } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

@Pipe({
    name: 'parsePollNumber'
})
export class ParsePollNumberPipe implements PipeTransform {
    public constructor(private translate: TranslateService) {}

    public transform(value: number): number | string {
        const input = Math.trunc(value);
        switch (input) {
            case -1:
                return this.translate.instant('majority');
            case -2:
                return this.translate.instant('undocumented');
            default:
                return input;
        }
    }
}
