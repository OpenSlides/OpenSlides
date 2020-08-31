import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';

import { GroupRepositoryService } from 'app/core/repositories/users/group-repository.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { VotingPrivacyWarningComponent } from 'app/shared/components/voting-privacy-warning/voting-privacy-warning.component';
import { AssignmentPollMethod, AssignmentPollPercentBase } from 'app/shared/models/assignments/assignment-poll';
import { PercentBase } from 'app/shared/models/poll/base-poll';
import { PollType } from 'app/shared/models/poll/base-poll';
import { infoDialogSettings } from 'app/shared/utils/dialog-settings';
import { ViewAssignmentPoll } from 'app/site/assignments/models/view-assignment-poll';
import { BaseViewComponentDirective } from 'app/site/base/base-view';
import {
    MajorityMethodVerbose,
    PollClassType,
    PollPropertyVerbose,
    PollTypeVerbose,
    ViewBasePoll
} from 'app/site/polls/models/view-base-poll';
import { ViewGroup } from 'app/site/users/models/view-group';
import { PollService } from '../../services/poll.service';

@Component({
    selector: 'os-poll-form',
    templateUrl: './poll-form.component.html',
    styleUrls: ['./poll-form.component.scss']
})
export class PollFormComponent<T extends ViewBasePoll, S extends PollService>
    extends BaseViewComponentDirective
    implements OnInit {
    /**
     * The form-group for the meta-info.
     */
    public contentForm: FormGroup;

    public PollType = PollType;
    public PollPropertyVerbose = PollPropertyVerbose;

    /**
     * The different methods for this poll.
     */
    @Input()
    public pollMethods: { [key: string]: string };

    /**
     * The different percent bases for this poll.
     */
    @Input()
    public percentBases: { [key: string]: string };

    @Input()
    public data: Partial<T>;

    @Input()
    private pollService: S;

    /**
     * The different types the poll can accept.
     */
    public pollTypes = PollTypeVerbose;

    /**
     * The majority methods for the poll.
     */
    public majorityMethods = MajorityMethodVerbose;

    /**
     * the filtered `percentBases`.
     */
    public validPercentBases: { [key: string]: string };

    /**
     * Reference to the observable of the groups. Used by the `search-value-component`.
     */
    public groupObservable: Observable<ViewGroup[]> = null;

    /**
     * An twodimensional array to handle constant values for this poll.
     */
    public pollValues: [string, unknown][] = [];

    /**
     * Model for the checkbox.
     * If true, the given poll will immediately be published.
     */
    public publishImmediately = true;

    public showNonNominalWarning = false;

    public get isEVotingEnabled(): boolean {
        if (this.pollService) {
            return this.pollService.isElectronicVotingEnabled;
        } else {
            return false;
        }
    }

    /**
     * Constructor. Retrieves necessary metadata from the pollService,
     * injects the poll itself
     */
    public constructor(
        title: Title,
        protected translate: TranslateService,
        snackbar: MatSnackBar,
        private fb: FormBuilder,
        private groupRepo: GroupRepositoryService,
        private configService: ConfigService,
        private dialog: MatDialog
    ) {
        super(title, translate, snackbar);
        this.initContentForm();
    }

    /**
     * OnInit.
     * Sets the observable for groups.
     */
    public ngOnInit(): void {
        // without default group since default cant ever vote
        this.groupObservable = this.groupRepo.getViewModelListObservableWithoutDefaultGroup();

        if (this.data) {
            if (this.data.state) {
                this.disablePollType();
            }

            if (this.data instanceof ViewAssignmentPoll) {
                if (this.data.assignment && !this.data.votes_amount) {
                    this.data.votes_amount = this.data.assignment.open_posts;
                }
                if (!this.data.pollmethod) {
                    this.data.pollmethod = this.configService.instant('assignment_poll_method');
                }
            }

            Object.keys(this.contentForm.controls).forEach(key => {
                if (this.data[key]) {
                    this.contentForm.get(key).patchValue(this.data[key]);
                }
            });
        }
        this.updatePollValues(this.contentForm.value);
        this.updatePercentBases(this.contentForm.get('pollmethod').value);

        this.subscriptions.push(
            // changes to whole form
            this.contentForm.valueChanges.subscribe(values => {
                if (values) {
                    this.updatePollValues(values);
                }
            }),
            // poll method changes
            this.contentForm.get('pollmethod').valueChanges.subscribe(method => {
                if (method) {
                    this.updatePercentBases(method);
                    this.setVotesAmountCtrl();
                }
            }),
            // poll type changes
            this.contentForm.get('type').valueChanges.subscribe(() => {
                this.setVotesAmountCtrl();
            })
        );
    }

    private disablePollType(): void {
        this.contentForm.get('type').disable();
    }

    /**
     * updates the available percent bases according to the pollmethod
     * @param method the currently chosen pollmethod
     */
    private updatePercentBases(method: AssignmentPollMethod): void {
        if (method) {
            let forbiddenBases = [];
            if (method === AssignmentPollMethod.YN) {
                forbiddenBases = [PercentBase.YNA, AssignmentPollPercentBase.Votes];
            } else if (method === AssignmentPollMethod.YNA) {
                forbiddenBases = [AssignmentPollPercentBase.Votes];
            } else if (method === AssignmentPollMethod.Votes) {
                forbiddenBases = [PercentBase.YN, PercentBase.YNA];
            }

            const bases = {};
            for (const [key, value] of Object.entries(this.percentBases)) {
                if (!forbiddenBases.includes(key)) {
                    bases[key] = value;
                }
            }
            // update value in case that its no longer valid
            const percentBaseControl = this.contentForm.get('onehundred_percent_base');
            percentBaseControl.setValue(this.getNormedPercentBase(percentBaseControl.value, method));

            this.validPercentBases = bases;
        }
    }

    private getNormedPercentBase(
        base: AssignmentPollPercentBase,
        method: AssignmentPollMethod
    ): AssignmentPollPercentBase {
        if (
            method === AssignmentPollMethod.YN &&
            (base === AssignmentPollPercentBase.YNA || base === AssignmentPollPercentBase.Votes)
        ) {
            return AssignmentPollPercentBase.YN;
        } else if (method === AssignmentPollMethod.YNA && base === AssignmentPollPercentBase.Votes) {
            return AssignmentPollPercentBase.YNA;
        } else if (
            method === AssignmentPollMethod.Votes &&
            (base === AssignmentPollPercentBase.YN || base === AssignmentPollPercentBase.YNA)
        ) {
            return AssignmentPollPercentBase.Votes;
        }
        return base;
    }

    /**
     * Disable votes_amount form control if the poll type is anonymous
     * and the poll method is votes.
     */
    private setVotesAmountCtrl(): void {
        if (this.contentForm.get('type').value === PollType.Pseudoanonymous) {
            this.showNonNominalWarning = true;
        } else {
            this.showNonNominalWarning = false;
        }
    }

    public getValues<V extends ViewBasePoll>(): Partial<V> {
        return { ...this.data, ...this.contentForm.value };
    }

    /**
     * This updates the poll-values to get correct data in the view.
     *
     * @param data Passing the properties of the poll.
     */
    private updatePollValues(data: { [key: string]: any }): void {
        if (this.data) {
            this.pollValues = [
                [
                    this.pollService.getVerboseNameForKey('type'),
                    this.pollService.getVerboseNameForValue('type', data.type)
                ]
            ];
            // show pollmethod only for assignment polls
            if (this.data.pollClassType === PollClassType.Assignment) {
                this.pollValues.push([
                    this.pollService.getVerboseNameForKey('pollmethod'),
                    this.pollService.getVerboseNameForValue('pollmethod', data.pollmethod)
                ]);
            }
            if (data.type !== 'analog') {
                this.pollValues.push([
                    this.pollService.getVerboseNameForKey('groups'),
                    data && data.groups_id && data.groups_id.length
                        ? this.groupRepo.getNameForIds(...data.groups_id)
                        : '---'
                ]);
            }
            if (data.pollmethod === 'votes') {
                this.pollValues.push([this.pollService.getVerboseNameForKey('votes_amount'), data.votes_amount]);
                this.pollValues.push([this.pollService.getVerboseNameForKey('global_no'), data.global_no]);
                this.pollValues.push([this.pollService.getVerboseNameForKey('global_abstain'), data.global_abstain]);
            }
        }
    }

    private initContentForm(): void {
        this.contentForm = this.fb.group({
            title: ['', Validators.required],
            type: ['', Validators.required],
            pollmethod: ['', Validators.required],
            onehundred_percent_base: ['', Validators.required],
            majority_method: ['', Validators.required],
            votes_amount: [1, [Validators.required, Validators.min(1)]],
            groups_id: [],
            global_no: [false],
            global_abstain: [false]
        });
    }

    public openVotingWarning(): void {
        this.dialog.open(VotingPrivacyWarningComponent, infoDialogSettings);
    }

    /**
     * compare function used with the KeyValuePipe to display the percent bases in original order
     */
    public keepEntryOrder(): number {
        return 0;
    }
}
