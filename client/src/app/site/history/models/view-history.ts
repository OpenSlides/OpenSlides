import { BaseViewModel } from 'app/site/base/base-view-model';
import { History } from 'app/shared/models/core/history';
import { User } from 'app/shared/models/users/user';
import { BaseModel } from 'app/shared/models/base/base-model';

/**
 * View model for history objects
 */
export class ViewHistory extends BaseViewModel {
    /**
     * Private BaseModel of the history
     */
    private _history: History;

    /**
     * Real representation of the user who altered the history.
     * Determined from `History.user_id`
     */
    private _user: User;

    /**
     * Read the history property
     */
    public get history(): History {
        return this._history ? this._history : null;
    }

    /**
     * Read the user property
     */
    public get user(): User {
        return this._user ? this._user : null;
    }

    /**
     * Get the ID of the history object
     * Required by BaseViewModel
     *
     * @returns the ID as number
     */
    public get id(): number {
        return this.history ? this.history.id : null;
    }

    /**
     * Get the elementIs of the history object
     *
     * @returns the element ID as String
     */
    public get element_id(): string {
        return this.history ? this.history.element_id : null;
    }

    /**
     * Get the information about the history
     *
     * @returns a string with the information to the history object
     */
    public get information(): string {
        return this.history ? this.history.information : null;
    }

    /**
     * Get the time of the history as number
     *
     * @returns the unix timestamp as number
     */
    public get now(): string {
        return this.history ? this.history.now : null;
    }

    /**
     * Construction of a ViewHistory
     *
     * @param history the real history BaseModel
     * @param user the real user BaseModel
     */
    public constructor(history?: History, user?: User) {
        super();
        this._history = history;
        this._user = user;
    }

    /**
     * Converts the date (this.now) to a time and date string.
     *
     * @param locale locale indicator, i.e 'de-DE'
     * @returns a human readable kind of time and date representation
     */
    public getLocaleString(locale: string): string {
        return this.history.date ? this.history.date.toLocaleString(locale) : null;
    }

    /**
     * Converts elementID into collection string
     * @returns the CollectionString to the model
     */
    public getCollectionString(): string {
        return this.element_id.split(":")[0]
    }

    /**
     * Extract the models ID from the elementID
     * @returns a model id
     */
    public getModelID(): number {
        return +this.element_id.split(":")[1]
    }

    /**
     * Get the history objects title
     * Required by BaseViewModel
     *
     * @returns history.getTitle which returns the element_id
     */
    public getTitle(): string {
        return this.history.getTitle();
    }

    /**
     * Updates the history object with new values
     *
     * @param update potentially the new values for history or it's components.
     */
    public updateValues(update: BaseModel): void {
        if (update instanceof History && this.history.id === update.id) {
            this._history = update;
        } else if (this.history && update instanceof User && this.history.user_id === update.id) {
            this._user = update;
        }
    }
}
