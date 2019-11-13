import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material';

import { CollectionStringMapperService } from 'app/core/core-services/collection-string-mapper.service';
import { BasePollDialogService } from 'app/core/ui-services/base-poll-dialog.service';
import { MotionPollDialogComponent } from 'app/site/motions/modules/motion-poll/motion-poll-dialog/motion-poll-dialog.component';
import { MotionPollService } from './motion-poll.service';
import { ViewMotionPoll } from '../models/view-motion-poll';

/**
 * Subclassed to provide the right `PollService` and `DialogComponent`
 */
@Injectable({
    providedIn: 'root'
})
export class MotionPollDialogService extends BasePollDialogService<ViewMotionPoll> {
    protected dialogComponent = MotionPollDialogComponent;

    public constructor(dialog: MatDialog, mapper: CollectionStringMapperService, service: MotionPollService) {
        super(dialog, mapper, service);
    }
}
