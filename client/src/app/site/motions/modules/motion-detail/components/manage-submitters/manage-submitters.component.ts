import { Component, Input } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { MotionRepositoryService } from 'app/core/repositories/motions/motion-repository.service';
import { UserRepositoryService } from 'app/core/repositories/users/user-repository.service';
import { ErrorService } from 'app/core/ui-services/error.service';
import { User } from 'app/shared/models/users/user';
import { BaseViewComponent } from 'app/site/base/base-view';
import { ViewMotion } from 'app/site/motions/models/view-motion';
import { LocalPermissionsService } from 'app/site/motions/services/local-permissions.service';
import { ViewUser } from 'app/site/users/models/view-user';

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
    public users: BehaviorSubject<ViewUser[]>;

    /**
     * The form to add new submitters
     */
    public addSubmitterForm: FormGroup;

    /**
     * The current list of submitters.
     */
    public readonly editSubmitterSubject: BehaviorSubject<ViewUser[]> = new BehaviorSubject([]);

    /**
     * The observable from editSubmitterSubject. Fixing this value is a performance boost, because
     * it is just set one time at loading instead of calling .asObservable() every time.
     */
    public editSubmitterObservable: Observable<ViewUser[]>;

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
     * @param motionRepository
     * @param perms permission checks for the motion
     */
    public constructor(
        title: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        errorService: ErrorService,
        private viewModelStore: ViewModelStoreService,
        private motionRepository: MotionRepositoryService,
        private userRepository: UserRepositoryService,
        public perms: LocalPermissionsService
    ) {
        super(title, translate, matSnackBar, errorService);

        this.addSubmitterForm = new FormGroup({ userId: new FormControl([]) });
        this.editSubmitterObservable = this.editSubmitterSubject.asObservable();

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
        this.editSubmitterSubject.next(this.motion.submittersAsUsers);
        this.addSubmitterForm.reset();

        // get all users for the submitter add form
        this.users = this.userRepository.getViewModelListBehaviorSubject();
    }

    /**
     * Save the submitters
     */
    public onSave(): void {
        this.motionRepository
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
            submitters.push(this.viewModelStore.get(ViewUser, userId));
            this.editSubmitterSubject.next(submitters);
        }
        this.addSubmitterForm.reset();
    }

    /**
     * A sort event occures. Saves the new order into the editSubmitterSubject.
     *
     * @param users The new, sorted users.
     */
    public onSortingChange(users: ViewUser[]): void {
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
