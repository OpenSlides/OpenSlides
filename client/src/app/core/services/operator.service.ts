import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { HttpClient, HttpResponse, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { tap, catchError, share } from 'rxjs/operators';
import { BaseComponent } from 'app/base.component';
import { Group } from 'app/core/models/users/group';

// TODO: Dry
const httpOptions = {
    withCredentials: true,
    headers: new HttpHeaders({
        'Content-Type': 'application/json'
    })
};

@Injectable({
    providedIn: 'root'
})
export class OperatorService extends BaseComponent {
    // default variables
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
    // subject
    private operatorSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);
    // real groups, once they arrived in datastore
    private groups: Group[] = new Array();

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

    // calls 'whoami' to find out the operator
    public whoAmI(): Observable<any> {
        return this.http.get<any>('/users/whoami/', httpOptions).pipe(
            tap(whoami => {
                if (whoami && whoami.user) {
                    this.storeUser(whoami.user);
                }
            }),
            catchError(this.handleError())
        );
    }

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
        this.updateLocalStorrage();
        // update mode to inform observers
        this.updateMode();
    }

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
        this.updateMode();
        localStorage.removeItem('operator');
    }

    private updateLocalStorrage(): void {
        localStorage.setItem('operator', JSON.stringify(this.getUpdateObject()));
        console.log('update local storrage: groups: ', this.groups_id);
    }

    private updateMode(): void {
        this.setObservable(this.getUpdateObject());
    }

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

    // observe dataStore to set groups once they are there
    // TODO logic to remove groups / user from certain groups
    private observeDataStore(): void {
        console.log('Operator observes DataStore');
        this.DS.getObservable().subscribe(newModel => {
            if (newModel instanceof Group) {
                this.addGroup(newModel);
            }
        });
    }

    // read out the Groups from the DataStore by the operators 'groups_id'
    // requires that the DataStore has been setup (websocket.service)
    // requires that the whoAmI did return a valid operator
    public readGroupsFromStore(): void {
        this.DS.filter(Group, myGroup => {
            if (this.groups_id.includes(myGroup.id)) {
                this.addGroup(myGroup);
            }
        });
    }

    public getObservable() {
        return this.operatorSubject.asObservable();
    }

    private setObservable(value) {
        this.operatorSubject.next(value);
    }

    public getGroups() {
        return this.groups;
    }

    // if the operator has the corresponding ID, set the group
    private addGroup(newGroup: Group): void {
        if (this.groups_id.includes(newGroup.id)) {
            this.groups.push(newGroup);
            // inform the observers about new groups (appOsPerms)
            console.log('pushed a group into operator');
            this.setObservable(newGroup);
        }
    }

    // TODO Dry
    private handleError<T>() {
        return (error: any): Observable<T> => {
            console.error(error);
            return of(error);
        };
    }
}
