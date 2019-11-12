import { Component, Input } from '@angular/core';
import { MatDialog, MatSnackBar } from '@angular/material';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { MotionPollRepositoryService } from 'app/core/repositories/motions/motion-poll-repository.service';
import { MotionPoll } from 'app/shared/models/motions/motion-poll';
import { mediumDialogSettings } from 'app/shared/utils/dialog-settings';
import { BaseViewComponent } from 'app/site/base/base-view';
import { ViewMotion } from 'app/site/motions/models/view-motion';
import { ViewMotionPoll } from 'app/site/motions/models/view-motion-poll';
import { LocalPermissionsService } from 'app/site/motions/services/local-permissions.service';
import { MotionPollService } from 'app/site/motions/services/motion-poll.service';
import { MotionPollDialogComponent } from '../../../../motion-poll/motion-poll-dialog/motion-poll-dialog.component';

@Component({
    selector: 'os-motion-poll-manager',
    templateUrl: './motion-poll-manager.component.html',
    styleUrls: ['./motion-poll-manager.component.scss']
})
export class MotionPollManagerComponent extends BaseViewComponent {
    /**
     * The dedicated motion.
     */
    @Input()
    public motion: ViewMotion;

    /**
     * Gets all motion-polls related to the given motion.
     */
    public get polls(): ViewMotionPoll[] {
        return this.motion ? this.motion.polls : [];
    }

    /**
     * Default constructor.
     */
    public constructor(
        title: Title,
        protected translate: TranslateService,
        matSnackbar: MatSnackBar,
        private pollRepo: MotionPollRepositoryService,
        private service: MotionPollService,
        private dialog: MatDialog,
        public perms: LocalPermissionsService
    ) {
        super(title, translate, matSnackbar);
    }

    /**
     * Opens the to enter votes and edit the meta-info for a motion-poll.
     *
     * @param motionId The id of the related motion - number.
     * @param data Optional. Passing the data for the motion-poll, if existing - any.
     */
    public openVoteDialog(motionId: number, data?: any): void {
        const dialogRef = this.dialog.open(MotionPollDialogComponent, {
            data: data ? data : this.service.getDefaultPollData(motionId),
            ...mediumDialogSettings
        });
        dialogRef.afterClosed().subscribe(async result => {
            if (!result) {
                return;
            }
            const poll = await this.savePoll(result.poll, data);
            if (result.data) {
                this.pollRepo.enterAnalogVote(poll.poll, result.data);
            }
        });
    }

    /**
     * Function to save changes for this poll.
     *
     * @param data The data to create or update the motion-poll.
     * @param model Optional. The existing `ViewMotionPoll`, if it should be updated.
     *
     * @returns The created respectively updated `ViewMotionPoll`.
     */
    public async savePoll(data: any, model?: ViewMotionPoll): Promise<ViewMotionPoll> {
        if (!model) {
            const id = await this.pollRepo.create(data);
            const poll = new MotionPoll(data);
            poll.id = id.id;
            poll.state = 1;
            return new ViewMotionPoll(poll);
        } else {
            const update = {
                // title: data.title,
                onehundred_percent_base: data.onehundred_percent_base,
                majority_method: data.majority_method
            };
            console.log('update', update);
            await this.pollRepo.update(update, model);
            return model;
        }
    }
}
