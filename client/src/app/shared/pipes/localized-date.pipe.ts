import { Pipe, PipeTransform } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';

/**
 * pipe to convert and translate dates
 */
@Pipe({
    name: 'localizedDate',
    pure: false
})
export class LocalizedDatePipe implements PipeTransform {
    public constructor(private translate: TranslateService) {}

    public transform(date: Date | number, dateFormat: string = 'lll'): any {
        let unixDate: number;
        if (date instanceof Date) {
            unixDate = date.getTime() / 1000;
        } else if (typeof date === 'number') {
            unixDate = date;
        }

        const lang = this.translate.currentLang ? this.translate.currentLang : this.translate.defaultLang;
        if (!date) {
            return '';
        }
        moment.locale(lang);
        const dateLocale = moment.unix(unixDate).local();
        return dateLocale.format(dateFormat);
    }
}
