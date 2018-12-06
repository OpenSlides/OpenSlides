import { Component, Input } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material';

import { BehaviorSubject, Observable } from 'rxjs';

import { ViewMotion } from '../../models/view-motion';
import { User } from 'app/shared/models/users/user';
import { DataStoreService } from 'app/core/services/data-store.service';
import { MotionRepositoryService } from '../../services/motion-repository.service';
import { BaseViewComponent } from 'app/site/base/base-view';

/**
 * Component for the motion comments view
 */
@Component({
    selector: 'os-manage-submitters',
    templateUrl: './manage-submitters.component.html',
    styleUrls: ['./manage-submitters.component.scss']
})
export class ManageSubmittersComponent extends BaseViewComponent {
    /**
     * The motion, which the personal note belong to.
     */
    @Input()
    public motion: ViewMotion;

    /**
     * Keep all users to display them.
     */
    public users: BehaviorSubject<User[]>;

    /**
     * The form to add new submitters
     */
    public addSubmitterForm: FormGroup;

    /**
     * The current list of submitters.
     */
    public readonly editSubmitterSubject: BehaviorSubject<User[]> = new BehaviorSubject([]);

    /**
     * The observable from editSubmitterSubject. Fixing this value is a performance boost, because
     * it is just set one time at loading instead of calling .asObservable() every time.
     */
    public editSubmitterObservable: Observable<User[]>;

    /**
     * Saves, if the users edits the note.
     */
    public isEditMode = false;

    /**
     * Sets up the form and observables.
     *
     * @param title
     * @param translate
     * @param matSnackBar
     * @param DS
     * @param repo
     */
    public constructor(
        title: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        private DS: DataStoreService,
        private repo: MotionRepositoryService
    ) {
        super(title, translate, matSnackBar);

        this.addSubmitterForm = new FormGroup({ userId: new FormControl([]) });
        this.editSubmitterObservable = this.editSubmitterSubject.asObservable();

        // get all users for the submitter add form
        this.users = new BehaviorSubject(this.DS.getAll(User));
        this.DS.changeObservable.subscribe(model => {
            if (model instanceof User) {
                this.users.next(this.DS.getAll(User));
            }
        });

        // detect changes in the form
        this.addSubmitterForm.valueChanges.subscribe(formResult => {
            if (formResult && formResult.userId) {
                this.addNewSubmitter(formResult.userId);
            }
        });
    }

    /**
     * Enter the edit mode and reset the form and the submitters.
     */
    public onEdit(): void {
        this.isEditMode = true;
        this.editSubmitterSubject.next(this.motion.submitters.map(x => x));
        this.addSubmitterForm.reset();
    }

    /**
     * Save the submitters
     */
    public onSave(): void {
        this.repo
            .setSubmitters(this.motion, this.editSubmitterSubject.getValue())
            .then(() => (this.isEditMode = false), this.raiseError);
    }

    /**
     * Close the edit view.
     */
    public onCancel(): void {
        this.isEditMode = false;
    }

    /**
     * Adds the user to the submitters, if he isn't already in there.
     *
     * @param userId The user to add
     */
    public addNewSubmitter(userId: number): void {
        const submitters = this.editSubmitterSubject.getValue();
        if (!submitters.map(u => u.id).includes(userId)) {
            submitters.push(this.DS.get(User, userId));
            this.editSubmitterSubject.next(submitters);
        }
        this.addSubmitterForm.reset();
    }

    /**
     * A sort event occures. Saves the new order into the editSubmitterSubject.
     *
     * @param users The new, sorted users.
     */
    public onSortingChange(users: User[]): void {
        this.editSubmitterSubject.next(users);
    }

    /**
     * Removes the user from the list of submitters.
     *
     * @param user The user to remove as a submitters
     */
    public onRemove(user: User): void {
        const submitters = this.editSubmitterSubject.getValue();
        this.editSubmitterSubject.next(submitters.filter(u => u.id !== user.id));
    }
}
