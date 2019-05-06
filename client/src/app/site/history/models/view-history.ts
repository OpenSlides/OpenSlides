import { BaseViewModel } from 'app/site/base/base-view-model';
import { History } from 'app/shared/models/core/history';
import { ViewUser } from 'app/site/users/models/view-user';

export type ProxyHistory = History & { user?: ViewUser };

/**
 * View model for history objects
 */
export class ViewHistory extends BaseViewModel {
    public static COLLECTIONSTRING = History.COLLECTIONSTRING;

    /**
     * Private BaseModel of the history
     */
    private _history: ProxyHistory;

    /**
     * Read the history property
     */
    public get history(): ProxyHistory {
        return this._history;
    }

    /**
     * Gets the users ViewUser.
     */
    public get user(): ViewUser | null {
        return this.history.user;
    }

    /**
     * Get the id of the history object
     * Required by BaseViewModel
     *
     * @returns the id as number
     */
    public get id(): number {
        return this.history.id;
    }

    /**
     * @returns the users full name
     */
    public get user_full_name(): string {
        return this.history.user ? this.history.user.full_name : '';
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
    public constructor(history: ProxyHistory) {
        super(History.COLLECTIONSTRING);
        this._history = history;
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

    public getModel(): History {
        return this.history;
    }

    public updateDependencies(update: BaseViewModel): void {}
}
