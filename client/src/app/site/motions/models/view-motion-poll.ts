import { ChartData } from 'app/shared/components/charts/charts.component';
import { MotionPoll, MotionPollMethods } from 'app/shared/models/motions/motion-poll';
import { PollColor } from 'app/shared/models/poll/base-poll';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import { ViewMotionOption } from 'app/site/motions/models/view-motion-option';
import { ViewBasePoll } from 'app/site/polls/models/view-base-poll';
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

    public initChartLabels(): string[] {
        return ['Votes'];
    }

    public generateTableData(): {}[] {
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
            projectionDefaultName: 'motion-poll',
            getDialogTitle: this.getTitle
        };
    }

    public get pollmethodVerbose(): string {
        return MotionPollMethodsVerbose[this.pollmethod];
    }
}

export interface ViewMotionPoll extends MotionPoll {
    motion: ViewMotion;
    options: ViewMotionOption[];
}
