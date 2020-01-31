import { ChartData } from 'app/shared/components/charts/charts.component';
import { MotionPoll, MotionPollMethods } from 'app/shared/models/motions/motion-poll';
import { PollColor, PollState } from 'app/shared/models/poll/base-poll';
import { BaseViewModel } from 'app/site/base/base-view-model';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import { ViewMotionOption } from 'app/site/motions/models/view-motion-option';
import { PollData, ViewBasePoll } from 'app/site/polls/models/view-base-poll';
import { ViewMotion } from './view-motion';

export interface MotionPollTitleInformation {
    title: string;
}

export const MotionPollMethodsVerbose = {
    YN: 'Yes/No',
    YNA: 'Yes/No/Abstain'
};

export class ViewMotionPoll extends ViewBasePoll<MotionPoll> implements MotionPollTitleInformation {
    public static COLLECTIONSTRING = MotionPoll.COLLECTIONSTRING;
    protected _collectionString = MotionPoll.COLLECTIONSTRING;

    public readonly pollClassType: 'assignment' | 'motion' = 'motion';

    private tableKeys = ['yes', 'no', 'abstain'];
    private voteKeys = ['votesvalid', 'votesinvalid', 'votescast'];

    public get hasVotes(): boolean {
        return !!this.options[0].votes.length;
    }

    public initChartLabels(): string[] {
        return ['Votes'];
    }

    public getContentObject(): BaseViewModel {
        return this.motion;
    }

    public generateTableData(): PollData[] {
        let tableData = this.options.flatMap(vote => this.tableKeys.map(key => ({ key: key, value: vote[key] })));
        tableData.push(...this.voteKeys.map(key => ({ key: key, value: this[key] })));
        tableData = tableData.map(entry => (entry.value >= 0 ? entry : { key: entry.key, value: null }));
        return tableData;
    }

    public generateChartData(): ChartData {
        const fields = ['yes', 'no'];
        if (this.pollmethod === MotionPollMethods.YNA) {
            fields.push('abstain');
        }
        const data: ChartData = fields.map(key => ({
            label: key.toUpperCase(),
            data: this.options.map(option => option[key]),
            backgroundColor: PollColor[key],
            hoverBackgroundColor: PollColor[key]
        }));

        return data;
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
        return MotionPollMethodsVerbose[this.pollmethod];
    }

    /**
     * Override from base poll to skip started state in analog poll type
     */
    public getNextStates(): { [key: number]: string } {
        if (this.poll.type === 'analog' && this.state === PollState.Created) {
            return null;
        }
        return super.getNextStates();
    }
}

export interface ViewMotionPoll extends MotionPoll {
    motion: ViewMotion;
    options: ViewMotionOption[];
}
