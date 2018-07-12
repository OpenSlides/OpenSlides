import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { tap, catchError, share } from 'rxjs/operators';
import { OpenSlidesComponent } from 'app/openslides.component';
import { Group } from 'app/core/models/users/group';

/**
 * The operator represents the user who is using OpenSlides.
 *
 * Information is mostly redundant to user but has different purposes.
 * Changes in operator can be observed, directives do so on order to show
 * or hide certain information.
 *
 * Could extend User?
 *
 * The operator is an {@link OpenSlidesComponent}.
 */
@Injectable({
    providedIn: 'root'
})
export class OperatorService extends OpenSlidesComponent {
    about_me: string;
    comment: string;
    default_password: string;
    email: string;
    first_name: string;
    groups_id: number[];
    id: number;
    is_active: boolean;
    is_committee: boolean;
    is_present: boolean;
    last_email_send: string;
    last_name: string;
    number: string;
    structure_level: string;
    title: string;
    username: string;
    logged_in: boolean;

    /**
     * The subject that can be observed by other instances using observing functions.
     */
    private operatorSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

    /**
     * Representation of the {@link Group}s that the operator has (in contrast the the `groups_id`-Array)
     *
     * The operator observes the dataStore (compare {@link OpenSlidesComponent} in Order to know it's groups)
     */
    private groups: Group[] = new Array();

    /**
     * Recreates the operator from localStorage if it's found and starts to observe the dataStore.
     * @param http HttpClient
     */
    constructor(private http: HttpClient) {
        super();

        // recreate old operator from localStorage.
        if (localStorage.getItem('operator')) {
            const oldOperator = JSON.parse(localStorage.getItem('operator'));
            if (Object.keys(oldOperator).length > 0) {
                this.storeUser(oldOperator);
            }
        }

        // observe the datastore now to avoid race conditions. Ensures to
        // find the groups in time
        this.observeDataStore();
    }

    /**
     * calls `/users/whoami` to find out the real operator
     */
    public whoAmI(): Observable<any> {
        return this.http.get<any>('/users/whoami/').pipe(
            tap(whoami => {
                if (whoami && whoami.user) {
                    this.storeUser(whoami.user);
                }
            }),
            catchError(this.handleError())
        );
    }

    /**
     * Store the user Information in the operator, the localStorage and update the Observable
     * @param user usually a http response that represents a user.
     */
    public storeUser(user: any): void {
        // store in file
        this.about_me = user.about_me;
        this.comment = user.comment;
        this.default_password = user.default_password;
        this.email = user.email;
        this.first_name = user.first_name;
        this.groups_id = user.groups_id;
        this.id = user.id;
        this.is_active = user.is_active;
        this.is_committee = user.is_committee;
        this.is_present = user.is_present;
        this.last_email_send = user.last_email_send;
        this.last_name = user.last_name;
        this.number = user.number;
        this.structure_level = user.structure_level;
        this.title = user.title;
        this.username = user.username;
        // also store in localstorrage
        this.updateLocalStorage();
        // update mode to inform observers
        this.setObservable(this.getUpdateObject());
    }

    /**
     * Removes all stored information about the Operator.
     *
     * The Opposite of StoreUser. Usually a `logout()`-function.
     * Also removes the operator from localStorrage and
     * updates the observable.
     */
    public clear() {
        this.about_me = null;
        this.comment = null;
        this.default_password = null;
        this.email = null;
        this.first_name = null;
        this.groups_id = null;
        this.id = null;
        this.is_active = null;
        this.is_committee = null;
        this.is_present = null;
        this.last_email_send = null;
        this.last_name = null;
        this.number = null;
        this.structure_level = null;
        this.title = null;
        this.username = null;
        this.setObservable(this.getUpdateObject());
        localStorage.removeItem('operator');
    }

    /**
     * Saves the operator in the localStorage for easier and faster re-login
     *
     * This is a mere comfort feature, even if the operator can be recreated
     * it has to pass `this.whoAmI()` during page access.
     */
    private updateLocalStorage(): void {
        localStorage.setItem('operator', JSON.stringify(this.getUpdateObject()));
    }

    /**
     * Returns the current operator.
     *
     * Used to save the operator in localStorage or inform observers.
     */
    private getUpdateObject(): any {
        return {
            about_me: this.about_me,
            comment: this.comment,
            default_password: this.default_password,
            email: this.email,
            first_name: this.first_name,
            groups_id: this.groups_id,
            id: this.id,
            is_active: this.is_active,
            is_committee: this.is_committee,
            is_present: this.is_present,
            last_email_send: this.last_email_send,
            last_name: this.last_name,
            number: this.number,
            structure_level: this.structure_level,
            title: this.title,
            username: this.username,
            logged_in: this.logged_in
        };
    }

    /**
     * Observe dataStore to set groups once they are loaded.
     *
     * TODO logic to remove groups / user from certain groups. Currently is is only set and was never removed
     */
    private observeDataStore(): void {
        this.DS.getObservable().subscribe(newModel => {
            if (newModel instanceof Group) {
                this.addGroup(newModel);
            }
        });
    }

    /**
     * Read out the Groups from the DataStore by the operators 'groups_id'
     *
     * requires that the DataStore has been setup (websocket.service)
     * requires that the whoAmI did return a valid operator
     *
     * This is the normal behavior after a fresh login, everythin else can
     * be done by observers.
     */
    public readGroupsFromStore(): void {
        this.DS.filter(Group, myGroup => {
            if (this.groups_id.includes(myGroup.id)) {
                this.addGroup(myGroup);
            }
        });
    }

    /**
     * Returns the behaviorSubject as an observable.
     *
     * Services an components can use it to get informed when something changes in
     * the operator
     */
    public getObservable() {
        return this.operatorSubject.asObservable();
    }

    /**
     * Inform all observers about changes
     * @param value
     */
    private setObservable(value) {
        this.operatorSubject.next(value);
    }

    /**
     * Getter for the (real) {@link Group}s
     */
    public getGroups() {
        return this.groups;
    }

    /**
     * if the operator has the corresponding ID, set the group
     * @param newGroup potential group that the operator has.
     */
    private addGroup(newGroup: Group): void {
        if (this.groups_id.includes(newGroup.id as number)) {
            this.groups.push(newGroup);
            // inform the observers about new groups (appOsPerms)
            this.setObservable(newGroup);
        }
    }
}
