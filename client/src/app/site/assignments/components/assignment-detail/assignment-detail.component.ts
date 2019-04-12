import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatSnackBar, MatSelectChange } from '@angular/material';
import { Router, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

import { Assignment } from 'app/shared/models/assignments/assignment';
import { AssignmentPollService } from '../../services/assignment-poll.service';
import { AssignmentRepositoryService } from 'app/core/repositories/assignments/assignment-repository.service';
import { BaseViewComponent } from 'app/site/base/base-view';
import { ConstantsService } from 'app/core/ui-services/constants.service';
import { ItemRepositoryService } from 'app/core/repositories/agenda/item-repository.service';
import { LocalPermissionsService } from 'app/site/motions/services/local-permissions.service';
import { OperatorService } from 'app/core/core-services/operator.service';
import { AssignmentPoll } from 'app/shared/models/assignments/assignment-poll';
import { TagRepositoryService } from 'app/core/repositories/tags/tag-repository.service';
import { UserRepositoryService } from 'app/core/repositories/users/user-repository.service';
import { ViewAssignment, AssignmentPhase } from '../../models/view-assignment';
import { ViewItem } from 'app/site/agenda/models/view-item';
import { ViewportService } from 'app/core/ui-services/viewport.service';
import { ViewTag } from 'app/site/tags/models/view-tag';
import { ViewUser } from 'app/site/users/models/view-user';
import { PromptService } from 'app/core/ui-services/prompt.service';

/**
 * Component for the assignment detail view
 */
@Component({
    selector: 'os-assignment-detail',
    templateUrl: './assignment-detail.component.html',
    styleUrls: ['./assignment-detail.component.scss']
})
export class AssignmentDetailComponent extends BaseViewComponent implements OnInit {
    /**
     * Determines if the assignment is new
     */
    public newAssignment = false;

    /**
     * If true, the page is supposed to be in 'edit' mode (i.e. the assignment itself can be edited)
     */
    public editAssignment = false;

    /**
     * The different phases of an assignment. Info is fetched from server
     */
    public phaseOptions: AssignmentPhase[] = [];

    /**
     * List of users (used in searchValueSelector for candidates)
     * TODO Candidates already in the list should be filtered out
     */
    public availableCandidates = new BehaviorSubject<ViewUser[]>([]);

    /**
     * TODO a filtered list (excluding users already in this.assignment.candidates)
     */
    public filteredCandidates = new BehaviorSubject<ViewUser[]>([]);

    /**
     * Form for adding/removing candidates.
     */
    public candidatesForm: FormGroup;

    /**
     * Form for editing the assignment itself (TODO mergeable with candidates?)
     */
    public assignmentForm: FormGroup;

    /**
     * Used in the search Value selector to assign tags
     */
    public tagsObserver: BehaviorSubject<ViewTag[]>;

    /**
     * Used in the search Value selector to assign an agenda item
     */
    public agendaObserver: BehaviorSubject<ViewItem[]>;

    /**
     * Sets the assignment, e.g. via an auto update. Reload important things here:
     * - Poll base values are be recalculated
     *
     * @param assignment the assignment to set
     */
    public set assignment(assignment: ViewAssignment) {
        this._assignment = assignment;
        if (this.assignment.polls.length) {
            this.assignment.polls.forEach(poll => {
                poll.pollBase = this.pollService.getBaseAmount(poll);
            });
        }
    }

    /**
     * Returns the target assignment.
     */
    public get assignment(): ViewAssignment {
        return this._assignment;
    }

    /**
     * Current instance of ViewAssignment. Accessed via getter and setter.
     */
    private _assignment: ViewAssignment;

    /**
     * Copy instance of the assignment that the user might edit
     */
    public assignmentCopy: ViewAssignment;

    /**
     * Check if the operator is a candidate
     *
     * @returns true if they are in the list of candidates
     */
    public get isSelfCandidate(): boolean {
        return this.assignment.candidates.find(user => user.id === this.operator.user.id) ? true : false;
    }

    /**
     * gets the current assignment phase as string
     *
     * @returns a matching string (untranslated)
     */
    public get phaseString(): string {
        const mapping = this.phaseOptions.find(ph => ph.value === this.assignment.phase);
        return mapping ? mapping.display_name : '';
    }

    /**
     * Constructor. Build forms and subscribe to needed configs, constants and updates
     *
     * @param title
     * @param translate
     * @param matSnackBar
     * @param vp
     * @param operator
     * @param perms
     * @param router
     * @param route
     * @param formBuilder
     * @param repo
     * @param userRepo
     * @param constants
     * @param pollService
     * @param agendaRepo
     * @param tagRepo
     * @param promptService
     */
    public constructor(
        title: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        public vp: ViewportService,
        private operator: OperatorService,
        public perms: LocalPermissionsService,
        private router: Router,
        private route: ActivatedRoute,
        formBuilder: FormBuilder,
        public repo: AssignmentRepositoryService,
        private userRepo: UserRepositoryService,
        private constants: ConstantsService,
        public pollService: AssignmentPollService,
        private agendaRepo: ItemRepositoryService,
        private tagRepo: TagRepositoryService,
        private promptService: PromptService
    ) {
        super(title, translate, matSnackBar);
        /* Server side constants for phases */
        this.constants.get<AssignmentPhase[]>('AssignmentPhases').subscribe(phases => (this.phaseOptions = phases));
        /* List of eligible users */
        this.userRepo.getViewModelListObservable().subscribe(users => this.availableCandidates.next(users));
        this.assignmentForm = formBuilder.group({
            phase: null,
            tags_id: [],
            title: '',
            description: '',
            poll_description_default: '',
            open_posts: 0,
            agenda_item_id: '' // create agenda item
        });
        this.candidatesForm = formBuilder.group({
            candidate: null
        });
    }

    /**
     * Init data
     */
    public ngOnInit(): void {
        this.getAssignmentByUrl();
        this.agendaObserver = this.agendaRepo.getViewModelListBehaviorSubject();
        this.tagsObserver = this.tagRepo.getViewModelListBehaviorSubject();
    }

    /**
     * Permission check for interactions.
     *
     * Current operations supported:
     *  - addSelf: the user can add themself to the list of candidates
     *  - addOthers: the user can add other candidates
     *  - createPoll: the user can add/edit election poll (requires candidates to be present)
     *  - manage: the user has general manage permissions (i.e. editing the assignment metaInfo)
     *
     * @param operation the action requested
     * @returns true if the user is able to perform the action
     */
    public hasPerms(operation: string): boolean {
        const isManager = this.operator.hasPerms('assignments.can_manage');
        switch (operation) {
            case 'addSelf':
                if (isManager && this.assignment.phase !== 2) {
                    return true;
                } else {
                    return this.assignment.phase === 0 && this.operator.hasPerms('assignments.can_nominate_self');
                }
            case 'addOthers':
                if (isManager && this.assignment.phase !== 2) {
                    return true;
                } else {
                    return this.assignment.phase === 0 && this.operator.hasPerms('assignments.can_nominate_others');
                }
            case 'createPoll':
                return (
                    isManager && this.assignment && this.assignment.phase !== 2 && this.assignment.candidateAmount > 0
                );
            case 'manage':
                return isManager;
            default:
                return false;
        }
    }

    /**
     * Sets/unsets the 'edit assignment' mode
     *
     * @param newMode
     */
    public setEditMode(newMode: boolean): void {
        if (newMode && this.hasPerms('manage')) {
            this.patchForm(this.assignment);
            this.editAssignment = true;
        }
        if (!newMode && this.newAssignment) {
            this.router.navigate(['./assignments/']);
        }
        if (!newMode) {
            this.editAssignment = false;
        }
    }

    /**
     * Changes/updates the assignment form values
     *
     * @param assignment
     */
    private patchForm(assignment: ViewAssignment): void {
        this.assignmentCopy = assignment;
        this.assignmentForm.patchValue({
            tags_id: assignment.assignment.tags_id || [],
            agendaItem: assignment.assignment.agenda_item_id || null,
            phase: assignment.phase, // todo default: 0?
            description: assignment.assignment.description || '',
            poll_description_default: assignment.assignment.poll_description_default,
            open_posts: assignment.assignment.open_posts || 1
        });
    }

    /**
     * Save the current state of the assignment
     */
    public saveAssignment(): void {
        if (this.newAssignment) {
            this.createAssignment();
        } else {
            this.updateAssignmentFromForm();
        }
    }

    /**
     * Creates a new Poll
     * TODO: directly open poll dialog?
     */
    public async createPoll(): Promise<void> {
        await this.repo.addPoll(this.assignment).then(null, this.raiseError);
    }

    /**
     * Adds the operator to list of candidates
     */
    public async addSelf(): Promise<void> {
        await this.repo.addSelf(this.assignment).then(null, this.raiseError);
    }

    /**
     * Removes the operator from list of candidates
     */
    public async removeSelf(): Promise<void> {
        await this.repo.deleteSelf(this.assignment).then(null, this.raiseError);
    }

    /**
     * Adds a user to the list of candidates
     */
    public async addUser(): Promise<void> {
        const candId = this.candidatesForm.get('candidate').value;
        this.candidatesForm.setValue({ candidate: null });
        if (candId) {
            await this.repo.changeCandidate(candId, this.assignment).then(null, this.raiseError);
        }
    }

    /**
     * Removes a user from the list of candidates
     *
     * @param user Assignment User
     */
    public async removeUser(user: ViewUser): Promise<void> {
        await this.repo.changeCandidate(user.id, this.assignment).then(null, this.raiseError);
    }

    /**
     * Determine the assignment to display using the URL
     */
    public getAssignmentByUrl(): void {
        const params = this.route.snapshot.params;
        if (params && params.id) {
            // existing assignment
            const assignmentId: number = +params.id;
            // the following subscriptions need to be cleared when the route changes
            this.subscriptions.push(
                this.repo.getViewModelObservable(assignmentId).subscribe(assignment => {
                    if (assignment) {
                        this.assignment = assignment;
                        if (!this.editAssignment) {
                            this.patchForm(this.assignment);
                        }
                    }
                })
            );
        } else {
            this.newAssignment = true;
            // TODO set defaults?
            this.assignment = new ViewAssignment(new Assignment(), [], []);
            this.patchForm(this.assignment);
            this.setEditMode(true);
        }
    }

    /**
     * Handler for deleting the assignment
     */
    public async onDeleteAssignmentButton(): Promise<void> {
        const title = this.translate.instant('Are you sure you want to delete this election?');
        if (await this.promptService.open(title, this.assignment.getTitle())) {
            await this.repo.delete(this.assignment);
            this.router.navigate(['../assignments/']);
        }
    }

    /**
     * Handler for actions to be done on change of displayed poll
     * TODO: needed?
     */
    public onTabChange(): void {}

    /**
     * Handler for changing the phase of an assignment
     *
     * TODO: only with existing assignments, else it should fail
     * TODO check permissions and conditions
     *
     * @param event
     */
    public async setPhase(event: MatSelectChange): Promise<void> {
        if (!this.newAssignment && this.phaseOptions.find(option => option.value === event.value)) {
            this.repo.update({ phase: event.value }, this.assignment).then(null, this.raiseError);
        }
    }

    public onDownloadPdf(): void {
        // TODO: Download summary pdf
    }

    /**
     * Creates an assignment. Calls the "patchValues" function
     */
    public async createAssignment(): Promise<void> {
        const newAssignmentValues = { ...this.assignmentForm.value };

        if (!newAssignmentValues.agenda_parent_id) {
            delete newAssignmentValues.agenda_parent_id;
        }
        try {
            const response = await this.repo.create(newAssignmentValues);
            this.router.navigate(['./assignments/' + response.id]);
        } catch (e) {
            this.raiseError(this.translate.instant(e));
        }
    }

    public updateAssignmentFromForm(): void {
        this.repo.patch({ ...this.assignmentForm.value }, this.assignmentCopy).then(() => {
            this.editAssignment = false;
        }, this.raiseError);
    }

    /**
     * clicking Shift and Enter will save automatically
     * Hitting escape while in the edit form should cancel editing
     *
     * @param event has the code
     */
    public onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Enter' && event.shiftKey) {
            this.saveAssignment();
        }
        if (event.key === 'Escape') {
            this.setEditMode(false);
        }
    }

    /**
     * Assemble a meaningful label for the poll
     * TODO (currently e.g. 'Ballot 10 (unublished)')
     */
    public getPollLabel(poll: AssignmentPoll, index: number): string {
        const pubState = poll.published ? this.translate.instant('published') : this.translate.instant('unpublished');
        const title = this.translate.instant('Ballot');
        return `${title} ${index + 1} (${pubState})`;
    }
}
