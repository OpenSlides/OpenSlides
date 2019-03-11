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
     */
    public constructor() {}

    /**
     * gets the title
     */
    public getTitle = () => '–';

    /**
     * gets the list title
     */
    public getListTitle = () => this.getTitle();
}
