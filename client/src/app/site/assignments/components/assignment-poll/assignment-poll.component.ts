import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { OperatorService } from 'app/core/core-services/operator.service';
import { AssignmentPollRepositoryService } from 'app/core/repositories/assignments/assignment-poll-repository.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { BasePollComponent } from 'app/site/polls/components/base-poll.component';
import { AssignmentPollDialogService } from '../../services/assignment-poll-dialog.service';
import { ViewAssignmentOption } from '../../models/view-assignment-option';
import { ViewAssignmentPoll } from '../../models/view-assignment-poll';

/**
 * Component for a single assignment poll. Used in assignment detail view
 */
@Component({
    selector: 'os-assignment-poll',
    templateUrl: './assignment-poll.component.html',
    styleUrls: ['./assignment-poll.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class AssignmentPollComponent extends BasePollComponent<ViewAssignmentPoll> implements OnInit {
    /**
     * Form for updating the poll's description
     */
    public descriptionForm: FormGroup;

    /**
     * permission checks.
     * TODO stub
     *
     * @returns true if the user is permitted to do operations
     */
    public get canManage(): boolean {
        return this.operator.hasPerms('assignments.can_manage');
    }

    public get canSee(): boolean {
        return this.operator.hasPerms('assignments.can_see');
    }

    /**
     * @returns true if the description on the form differs from the poll's description
     */
    public get dirtyDescription(): boolean {
        return this.descriptionForm.get('description').value !== this.poll.description;
    }

    public constructor(
        titleService: Title,
        matSnackBar: MatSnackBar,
        translate: TranslateService,
        dialog: MatDialog,
        promptService: PromptService,
        repo: AssignmentPollRepositoryService,
        pollDialog: AssignmentPollDialogService,
        private operator: OperatorService,
        private formBuilder: FormBuilder
    ) {
        super(titleService, matSnackBar, translate, dialog, promptService, repo, pollDialog);
    }

    public ngOnInit(): void {
        /*this.majorityChoice =
            this.pollService.majorityMethods.find(method => method.value === this.pollService.defaultMajorityMethod) ||
            null;*/
        this.descriptionForm = this.formBuilder.group({
            description: this.poll ? this.poll.description : ''
        });
    }

    /**
     * Print the PDF of this poll with the corresponding options and numbers
     *
     */
    public printBallot(): void {
        throw new Error('TODO');
        // this.pdfService.printBallots(this.poll);
    }

    /**
     * Determines whether the candidate has reached the majority needed to pass
     * the quorum
     *
     * @param option
     * @returns true if the quorum is successfully met
     */
    public quorumReached(option: ViewAssignmentOption): boolean {
        /*const yesValue = this.poll.pollmethod === 'votes' ? 'Votes' : 'Yes';
        const amount = option.votes.find(v => v.value === yesValue).weight;
        const yesQuorum = this.pollService.yesQuorum(
            this.majorityChoice,
            this.pollService.calculationDataFromPoll(this.poll),
            option
        );
        return yesQuorum && amount >= yesQuorum;*/
        throw new Error('TODO');
    }

    /**
     * Mark/unmark an option as elected
     *
     * @param option
     */
    public toggleElected(option: ViewAssignmentOption): void {
        /*if (!this.operator.hasPerms('assignments.can_manage')) {
            return;
        }

        // TODO additional conditions: assignment not finished?
        const viewAssignmentRelatedUser = this.assignment.assignment_related_users.find(
            user => user.user_id === option.candidate_id
        );
        if (viewAssignmentRelatedUser) {
            this.assignmentRepo.markElected(viewAssignmentRelatedUser, this.assignment, !option.is_elected);
        }*/
    }

    /**
     * Sends the edited poll description to the server
     * TODO: Better feedback
     */
    public async onEditDescriptionButton(): Promise<void> {
        /*const desc: string = this.descriptionForm.get('description').value;
        await this.assignmentRepo.updatePoll({ description: desc }, this.poll).catch(this.raiseError);*/
    }

    /**
     * Fetches a tooltip string about the quorum
     * @param option
     * @returns a translated
     */
    public getQuorumReachedString(option: ViewAssignmentOption): string {
        /*const name = this.translate.instant(this.majorityChoice.display_name);
        const quorum = this.pollService.yesQuorum(
            this.majorityChoice,
            this.pollService.calculationDataFromPoll(this.poll),
            option
        );
        const isReached = this.quorumReached(option)
            ? this.translate.instant('reached')
            : this.translate.instant('not reached');
        return `${name} (${quorum}) ${isReached}`;*/
        throw new Error('TODO');
    }
}
