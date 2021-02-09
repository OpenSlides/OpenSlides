import { Pipe, PipeTransform } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';

/**
 * pipe to convert and translate dates
 * requires a "date"object
 */
@Pipe({
    name: 'localizedDate',
    pure: false
})
export class LocalizedDatePipe implements PipeTransform {
    public constructor(private translate: TranslateService) {}

    public transform(date: Date, dateFormat: string = 'lll'): any {
        const lang = this.translate.currentLang ? this.translate.currentLang : this.translate.defaultLang;
        if (!date) {
            return '';
        }
        moment.locale(lang);
        const dateLocale = moment.unix(date.getTime() / 1000).local();
        return dateLocale.format(dateFormat);
    }
}
