import { TranslateService } from '@ngx-translate/core';

import { Selectable } from './selectable';

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
    public getTitle = () => (this.translate ? this.translate.instant('None') : 'None');

    /**
     * gets the list title
     */
    public getListTitle = () => this.getTitle();
}
