import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { MatDialog } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { ConstantsService } from 'app/core/core-services/constants.service';
import { MotionRepositoryService } from 'app/core/repositories/motions/motion-repository.service';
import { CalculablePollKey } from 'app/core/ui-services/poll.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { MotionPoll } from 'app/shared/models/motions/motion-poll';
import { infoDialogSettings } from 'app/shared/utils/dialog-settings';
import { BaseViewComponent } from 'app/site/base/base-view';
import { LocalPermissionsService } from 'app/site/motions/services/local-permissions.service';
import { MotionPollPdfService } from 'app/site/motions/services/motion-poll-pdf.service';
import { MotionPollService } from 'app/site/motions/services/motion-poll.service';
import { MotionPollDialogComponent } from './motion-poll-dialog.component';

/**
 * A component used to display and edit polls of a motion.
 */
@Component({
    selector: 'os-motion-poll',
    templateUrl: './motion-poll.component.html',
    styleUrls: ['./motion-poll.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class MotionPollComponent extends BaseViewComponent implements OnInit {
    /**
     * A representation of all values of the current poll.
     */
    public pollValues: CalculablePollKey[];

    /**
     * The motion poll as coming from the server. Needs conversion of strings to numbers first
     * (see {@link ngOnInit})
     */
    @Input()
    public rawPoll: any;

    /**
     * (optional) number of poll iffor dispaly purpose
     */
    @Input()
    public pollIndex: number;

    /**
     * The current poll
     */
    public poll: MotionPoll;

    /**
     * The current choice for calulating a Quorum
     */
    public majorityChoice: string;

    /**
     * The constants available for calulating a quorum
     */
    public majorityChoices: { display_name: string; value: string }[] = [];

    /**
     * Getter for calulating the current quorum via pollService
     *
     * @returns the number required to be reached for a vote to match the quorum
     */
    public get yesQuorum(): number {
        return this.pollService.calculateQuorum(this.poll, this.majorityChoice);
    }

    /**
     * Indicates if the poll can be expressed with percentages and calculated quorums or is abstract
     *
     * @returns true if abstract (no calculations possible)
     */
    public get abstractPoll(): boolean {
        return this.pollService.getBaseAmount(this.poll) <= 0;
    }

    /**
     * Constructor. Subscribes to the constants and settings for motion polls
     *
     * @param title
     * @param translate TranslateService
     * @param matSnackbar
     * @param dialog Dialog Service for entering poll data
     * @param pollService MotionPollService
     * @param motionRepo Subscribing to the motion to update poll from the server
     * @param constants ConstantsService
     * @param config ConfigService
     * @param perms LocalPermissionService
     */
    public constructor(
        title: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        public dialog: MatDialog,
        public pollService: MotionPollService,
        private motionRepo: MotionRepositoryService,
        private constants: ConstantsService,
        private promptService: PromptService,
        public perms: LocalPermissionsService,
        private pdfService: MotionPollPdfService
    ) {
        super(title, translate, matSnackBar);
        this.pollValues = this.pollService.pollValues;
        this.majorityChoice = this.pollService.defaultMajorityMethod;
        this.subscribeMajorityChoices();
    }

    /**
     * Subscribes to updates of itself
     */
    public ngOnInit(): void {
        this.poll = new MotionPoll(this.rawPoll);
        this.motionRepo.getViewModelObservable(this.poll.motion_id).subscribe(viewmotion => {
            if (viewmotion) {
                const updatePoll = viewmotion.motion.polls.find(poll => poll.id === this.poll.id);
                if (updatePoll) {
                    this.poll = new MotionPoll(updatePoll);
                }
            }
        });
    }

    /**
     * Sends a delete request for this poll after a confirmation dialog has been accepted.
     */
    public async deletePoll(): Promise<void> {
        const title = this.translate.instant('Are you sure you want to delete this vote?');
        if (await this.promptService.open(title)) {
            this.motionRepo.deletePoll(this.poll).catch(this.raiseError);
        }
    }

    /**
     * @returns the label for a poll option
     */
    public getLabel(key: CalculablePollKey): string {
        return this.pollService.getLabel(key);
    }

    /**
     * @returns the icon's name for the icon of a poll option
     */
    public getIcon(key: CalculablePollKey): string {
        return this.pollService.getIcon(key);
    }

    /**
     * Transform special case numbers into their strings
     * @param key
     *
     * @returns the number if positive or the special values' translated string
     */
    public getNumber(key: CalculablePollKey): number | string {
        if (this.poll[key] >= 0) {
            return this.poll[key];
        } else {
            return this.translate.instant(this.pollService.getSpecialLabel(this.poll[key]));
        }
    }

    /**
     * Check if the value cannot be expressed in percentages.
     * @param key
     * @returns if the value cannot be calculated
     */
    public isAbstractValue(key: CalculablePollKey): boolean {
        return this.pollService.isAbstractValue(this.poll, key);
    }

    /**
     * Calculates the percentages of a value. See {@link MotionPollService.getPercent}
     *
     * @param value
     * @returns a number with two digits, 100.00 representing 100 percent. May be null if the value cannot be calulated
     */
    public getPercent(value: CalculablePollKey): number {
        return this.pollService.calculatePercentage(this.poll, value);
    }

    /**
     * Triggers the printing of the ballots
     */
    public printBallots(): void {
        this.pdfService.printBallots(this.poll);
    }

    /**
     * Triggers the 'edit poll' dialog'
     */
    public editPoll(): void {
        const dialogRef = this.dialog.open(MotionPollDialogComponent, {
            data: { ...this.poll },
            ...infoDialogSettings
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.motionRepo.updatePoll(result).catch(this.raiseError);
            }
        });
    }

    /**
     * Indicates if the necessary quorum is reached by the 'yes' votes
     *
     * @returns true if the quorum is reached
     */
    public get quorumYesReached(): boolean {
        return this.poll.yes >= this.yesQuorum;
    }

    /**
     * Subscribe to the available majority choices as given in the server-side constants
     */
    private subscribeMajorityChoices(): void {
        this.constants.get<any>('ConfigVariables').subscribe(constants => {
            const motionconst = constants.find(c => c.name === 'Motions');
            if (motionconst) {
                const ballotConst = motionconst.subgroups.find(s => s.name === 'Voting and ballot papers');
                if (ballotConst) {
                    const methods = ballotConst.items.find(b => b.key === 'motions_poll_default_majority_method');
                    this.majorityChoices = methods.choices;
                }
            }
        });
    }

    /**
     * Get a label for the quorum selection button. See {@link majorityChoices}
     * for possible values
     *
     * @returns a string from the angular material-icon font, or an empty string
     */
    public getQuorumLabel(): string {
        const choice = this.majorityChoices.find(ch => ch.value === this.majorityChoice);
        return choice ? choice.display_name : '';
    }
}
