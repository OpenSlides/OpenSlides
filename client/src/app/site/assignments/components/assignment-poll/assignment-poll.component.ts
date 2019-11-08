import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { OperatorService } from 'app/core/core-services/operator.service';
import { AssignmentRepositoryService } from 'app/core/repositories/assignments/assignment-repository.service';
import { CalculablePollKey, MajorityMethod } from 'app/core/ui-services/poll.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { mediumDialogSettings } from 'app/shared/utils/dialog-settings';
import { BaseViewComponent } from 'app/site/base/base-view';
import { AssignmentPollDialogComponent } from '../assignment-poll-dialog/assignment-poll-dialog.component';
import { AssignmentPollPdfService } from '../../services/assignment-poll-pdf.service';
import { AssignmentPollService } from '../../services/assignment-poll.service';
import { ViewAssignment } from '../../models/view-assignment';
import { ViewAssignmentPoll } from '../../models/view-assignment-poll';
import { ViewAssignmentPollOption } from '../../models/view-assignment-poll-option';

/**
 * Component for a single assignment poll. Used in assignment detail view
 */
@Component({
    selector: 'os-assignment-poll',
    templateUrl: './assignment-poll.component.html',
    styleUrls: ['./assignment-poll.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class AssignmentPollComponent extends BaseViewComponent implements OnInit {
    /**
     * The related assignment (used for metainfos, e.g. related user names)
     */
    @Input()
    public assignment: ViewAssignment;

    /**
     * The poll represented in this component
     */
    @Input()
    public poll: ViewAssignmentPoll;

    /**
     * Form for updating the poll's description
     */
    public descriptionForm: FormGroup;

    /**
     * The selected Majority method to display quorum calculations. Will be
     * set/changed by the user
     */
    public majorityChoice: MajorityMethod | null;

    /**
     * permission checks.
     * TODO stub
     *
     * @returns true if the user is permitted to do operations
     */
    public get canManage(): boolean {
        return this.operator.hasPerms('assignments.can_manage');
    }

    /**
     * Gets the voting options
     *
     * @returns all used (not undefined) option-independent values that are
     * used in this poll (e.g.)
     */
    public get pollValues(): CalculablePollKey[] {
        return this.pollService.getVoteOptionsByPoll(this.poll);
    }

    /**
     * @returns true if the description on the form differs from the poll's description
     */
    public get dirtyDescription(): boolean {
        return this.descriptionForm.get('description').value !== this.poll.description;
    }

    /**
     * @returns true if vote results can be seen by the user
     */
    public get pollData(): boolean {
        if (!this.poll.has_votes) {
            return false;
        }
        return this.poll.published || this.canManage;
    }

    /**
     * Gets the translated poll method name
     *
     * TODO: check/improve text here
     *
     * @returns a name for the poll method this poll is set to (which is determined
     * by the number of candidates and config settings).
     */
    public get pollMethodName(): string {
        if (!this.poll) {
            return '';
        }
        switch (this.poll.pollmethod) {
            case 'votes':
                return this.translate.instant('One vote per candidate');
            case 'yna':
                return this.translate.instant('Yes/No/Abstain per candidate');
            case 'yn':
                return this.translate.instant('Yes/No per candidate');
            default:
                return '';
        }
    }

    /**
     * constructor. Does nothing
     *
     * @param titleService
     * @param matSnackBar
     * @param pollService poll related calculations
     * @param operator permission checks
     * @param assignmentRepo The repository to the assignments
     * @param translate Translation service
     * @param dialog MatDialog for the vote entering dialog
     * @param promptService Prompts for confirmation dialogs
     * @param pdfService pdf service
     */
    public constructor(
        titleService: Title,
        matSnackBar: MatSnackBar,
        public pollService: AssignmentPollService,
        private operator: OperatorService,
        private assignmentRepo: AssignmentRepositoryService,
        public translate: TranslateService,
        public dialog: MatDialog,
        private promptService: PromptService,
        private formBuilder: FormBuilder,
        private pdfService: AssignmentPollPdfService
    ) {
        super(titleService, translate, matSnackBar);
    }

    /**
     * Gets the currently selected majority choice option from the repo
     */
    public ngOnInit(): void {
        this.majorityChoice =
            this.pollService.majorityMethods.find(method => method.value === this.pollService.defaultMajorityMethod) ||
            null;
        this.descriptionForm = this.formBuilder.group({
            description: this.poll ? this.poll.description : ''
        });
    }

    /**
     * Handler for the 'delete poll' button
     *
     * TODO: Some confirmation (advanced logic (e.g. not deleting published?))
     */
    public async onDeletePoll(): Promise<void> {
        const title = this.translate.instant('Are you sure you want to delete this ballot?');
        if (await this.promptService.open(title)) {
            await this.assignmentRepo.deletePoll(this.poll).catch(this.raiseError);
        }
    }

    /**
     * Print the PDF of this poll with the corresponding options and numbers
     *
     */
    public printBallot(): void {
        this.pdfService.printBallots(this.poll);
    }

    /**
     * Determines whether the candidate has reached the majority needed to pass
     * the quorum
     *
     * @param option
     * @returns true if the quorum is successfully met
     */
    public quorumReached(option: ViewAssignmentPollOption): boolean {
        const yesValue = this.poll.pollmethod === 'votes' ? 'Votes' : 'Yes';
        const amount = option.votes.find(v => v.value === yesValue).weight;
        const yesQuorum = this.pollService.yesQuorum(
            this.majorityChoice,
            this.pollService.calculationDataFromPoll(this.poll),
            option
        );
        return yesQuorum && amount >= yesQuorum;
    }

    /**
     * Opens the {@link AssignmentPollDialogComponent} dialog and then updates the votes, if the dialog
     * closes successfully (validation is done there)
     */
    public enterVotes(): void {
        const dialogRef = this.dialog.open(AssignmentPollDialogComponent, {
            data: this.poll,
            ...mediumDialogSettings
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.assignmentRepo.updateVotes(result, this.poll).catch(this.raiseError);
            }
        });
    }

    /**
     * Updates the majority method for this poll
     *
     * @param method the selected majority method
     */
    public setMajority(method: MajorityMethod): void {
        this.majorityChoice = method;
    }

    /**
     * Toggles the 'published' state
     */
    public togglePublished(): void {
        this.assignmentRepo.updatePoll({ published: !this.poll.published }, this.poll);
    }

    /**
     * Mark/unmark an option as elected
     *
     * @param option
     */
    public toggleElected(option: ViewAssignmentPollOption): void {
        if (!this.operator.hasPerms('assignments.can_manage')) {
            return;
        }

        // TODO additional conditions: assignment not finished?
        const viewAssignmentRelatedUser = this.assignment.assignment_related_users.find(
            user => user.user_id === option.candidate_id
        );
        if (viewAssignmentRelatedUser) {
            this.assignmentRepo.markElected(viewAssignmentRelatedUser, this.assignment, !option.is_elected);
        }
    }

    /**
     * Sends the edited poll description to the server
     * TODO: Better feedback
     */
    public async onEditDescriptionButton(): Promise<void> {
        const desc: string = this.descriptionForm.get('description').value;
        await this.assignmentRepo.updatePoll({ description: desc }, this.poll).catch(this.raiseError);
    }

    /**
     * Fetches a tooltip string about the quorum
     * @param option
     * @returns a translated
     */
    public getQuorumReachedString(option: ViewAssignmentPollOption): string {
        const name = this.translate.instant(this.majorityChoice.display_name);
        const quorum = this.pollService.yesQuorum(
            this.majorityChoice,
            this.pollService.calculationDataFromPoll(this.poll),
            option
        );
        const isReached = this.quorumReached(option)
            ? this.translate.instant('reached')
            : this.translate.instant('not reached');
        return `${name} (${quorum}) ${isReached}`;
    }
}
