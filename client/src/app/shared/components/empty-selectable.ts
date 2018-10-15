import { Selectable } from './selectable';
import { TranslateService } from '@ngx-translate/core';

/**
 * Class to display an "empty" Selectable
 */
export class EmptySelectable implements Selectable {
    /**
     * Since it is just empty, it could be just fixed 0
     */
    public id = 0;

    /**
     * Empty Constructor
     * @param translate translate Service
     */
    public constructor(private translate?: TranslateService) {}

    /**
     * gets the title
     */
    public getTitle(): string {
        if (this.translate) {
            return this.translate.instant('None');
        }
        return 'None';
    }

    /**
     * gets the list title
     */
    public getListTitle(): string {
        if (this.translate) {
            return this.translate.instant('None');
        }
        return 'None';
    }
}
