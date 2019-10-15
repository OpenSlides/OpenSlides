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

    public transform(value: any, dateFormat: string = 'lll'): any {
        const lang = this.translate.currentLang ? this.translate.currentLang : this.translate.defaultLang;
        if (!value) {
            return '';
        }
        moment.locale(lang);
        const dateLocale = moment.unix(value).local();
        return dateLocale.format(dateFormat);
    }
}
