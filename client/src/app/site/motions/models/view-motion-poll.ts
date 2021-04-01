import { MotionPoll, MotionPollMethod } from 'app/shared/models/motions/motion-poll';
import { PercentBase } from 'app/shared/models/poll/base-poll';
import { BaseViewModel } from 'app/site/base/base-view-model';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import { ViewMotionOption } from 'app/site/motions/models/view-motion-option';
import { PollClassType, ViewBasePoll } from 'app/site/polls/models/view-base-poll';
import { ViewMotion } from './view-motion';

export interface MotionPollTitleInformation {
    title: string;
}

export const MotionPollMethodVerbose = {
    YN: 'Yes/No',
    YNA: 'Yes/No/Abstain'
};

export const MotionPollPercentBaseVerbose = {
    YN: 'Yes/No',
    YNA: 'Yes/No/Abstain',
    valid: 'All valid ballots',
    cast: 'All casted ballots',
    entitled: 'All entitled users',
    disabled: 'Disabled (no percents)'
};

export class ViewMotionPoll
    extends ViewBasePoll<MotionPoll, MotionPollMethod, PercentBase>
    implements MotionPollTitleInformation {
    public static COLLECTIONSTRING = MotionPoll.COLLECTIONSTRING;
    protected _collectionString = MotionPoll.COLLECTIONSTRING;

    public readonly pollClassType = PollClassType.Motion;

    public get result(): ViewMotionOption {
        return this.options[0];
    }

    public get hasVotes(): boolean {
        return this.result && !!this.result.votes.length;
    }

    public getContentObject(): BaseViewModel {
        return this.motion;
    }

    public getSlide(): ProjectorElementBuildDeskriptor {
        return {
            getBasicProjectorElement: options => ({
                name: MotionPoll.COLLECTIONSTRING,
                id: this.id,
                getIdentifiers: () => ['name', 'id']
            }),
            slideOptions: [],
            projectionDefaultName: 'motion_poll',
            getDialogTitle: this.getTitle
        };
    }

    public get pollmethodVerbose(): string {
        return MotionPollMethodVerbose[this.pollmethod];
    }

    public get percentBaseVerbose(): string {
        return MotionPollPercentBaseVerbose[this.onehundred_percent_base];
    }

    public anySpecialVotes(): boolean {
        return this.result.yes < 0 || this.result.no < 0 || this.result.abstain < 0;
    }

    protected getDecimalFields(): string[] {
        return MotionPoll.DECIMAL_FIELDS;
    }
}

export interface ViewMotionPoll extends MotionPoll {
    motion: ViewMotion;
    options: ViewMotionOption[];
}
