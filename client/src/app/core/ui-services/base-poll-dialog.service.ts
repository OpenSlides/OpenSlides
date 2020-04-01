import { ComponentType } from '@angular/cdk/portal';
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { CollectionStringMapperService } from 'app/core/core-services/collection-string-mapper.service';
import { Collection } from 'app/shared/models/base/collection';
import { PollState, PollType } from 'app/shared/models/poll/base-poll';
import { mediumDialogSettings } from 'app/shared/utils/dialog-settings';
import { BasePollDialogComponent } from 'app/site/polls/components/base-poll-dialog.component';
import { ViewBasePoll } from 'app/site/polls/models/view-base-poll';
import { PollService } from 'app/site/polls/services/poll.service';

/**
 * Abstract class for showing a poll dialog. Has to be subclassed to provide the right `PollService`
 */
@Injectable({
    providedIn: 'root'
})
export abstract class BasePollDialogService<V extends ViewBasePoll, S extends PollService> {
    protected dialogComponent: ComponentType<BasePollDialogComponent<V, S>>;

    public constructor(private dialog: MatDialog, private mapper: CollectionStringMapperService) {}

    /**
     * Opens the dialog to enter votes and edit the meta-info for a poll.
     *
     * @param data Passing the (existing or new) data for the poll
     */
    public async openDialog(viewPoll: Partial<V> & Collection): Promise<void> {
        const dialogRef = this.dialog.open(this.dialogComponent, {
            data: viewPoll,
            ...mediumDialogSettings
        });
        const result = await dialogRef.afterClosed().toPromise();
        if (result) {
            const repo = this.mapper.getRepository(viewPoll.collectionString);
            if (!viewPoll.poll) {
                await repo.create(result);
            } else {
                let update = result;
                if (viewPoll.state !== PollState.Created) {
                    update = {
                        title: result.title,
                        onehundred_percent_base: result.onehundred_percent_base,
                        majority_method: result.majority_method,
                        description: result.description
                    };
                    if (viewPoll.type === PollType.Analog) {
                        update = {
                            ...update,
                            votes: result.votes,
                            publish_immediately: result.publish_immediately
                        };
                    }
                }
                await repo.patch(update, <V>viewPoll);
            }
        }
    }
}
