import { BaseViewModel } from 'app/site/base/base-view-model';
import { History } from 'app/shared/models/core/history';
import { ViewUser } from 'app/site/users/models/view-user';

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
    private _user: ViewUser | null;

    /**
     * Read the history property
     */
    public get history(): History {
        return this._history;
    }

    /**
     * Read the user property
     */
    public get user(): ViewUser {
        return this._user ? this._user : null;
    }

    /**
     * Get the ID of the history object
     * Required by BaseViewModel
     *
     * @returns the ID as number
     */
    public get id(): number {
        return this.history.id;
    }

    /**
     * Get the elementIDs of the history object
     *
     * @returns the element ID as String
     */
    public get element_id(): string {
        return this.history.element_id;
    }

    /**
     * Get the information about the history
     *
     * @returns a string with the information to the history object
     */
    public get information(): string {
        return this.history.information;
    }

    /**
     * Get the time of the history as number
     *
     * @returns the unix timestamp as number
     */
    public get now(): string {
        return this.history.now;
    }

    /**
     * This is set by the repository
     */
    public getVerboseName;

    /**
     * Construction of a ViewHistory
     *
     * @param history the real history BaseModel
     * @param user the real user BaseModel
     */
    public constructor(history: History, user?: ViewUser) {
        super(History.COLLECTIONSTRING);
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
        return this.history.date.toLocaleString(locale);
    }

    /**
     * Converts elementID into collection string
     * @returns the CollectionString to the model
     */
    public getCollectionString(): string {
        return this.element_id.split(':')[0];
    }

    /**
     * Extract the models ID from the elementID
     * @returns a model id
     */
    public getModelId(): number {
        return +this.element_id.split(':')[1];
    }

    /**
     * Get the history objects title
     * Required by BaseViewModel
     *
     * @returns history.getTitle which returns the element_id
     */
    public getTitle = () => {
        return this.element_id;
    };

    /**
     * Updates the history object with new values
     *
     * @param update potentially the new values for history or it's components.
     */
    public updateDependencies(update: BaseViewModel): void {
        if (update instanceof ViewUser && this.history.user_id === update.id) {
            this._user = update;
        }
    }
}
