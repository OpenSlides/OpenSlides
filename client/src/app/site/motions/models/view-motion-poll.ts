import { ChartData } from 'app/shared/components/charts/charts.component';
import { MotionPoll, MotionPollMethods } from 'app/shared/models/motions/motion-poll';
import { PercentBase, PollColor, PollState } from 'app/shared/models/poll/base-poll';
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

interface TableKey {
    vote: string;
    icon?: string;
    canHide: boolean;
    showPercent: boolean;
}

export class ViewMotionPoll extends ViewBasePoll<MotionPoll> implements MotionPollTitleInformation {
    public static COLLECTIONSTRING = MotionPoll.COLLECTIONSTRING;
    protected _collectionString = MotionPoll.COLLECTIONSTRING;

    public readonly pollClassType: 'assignment' | 'motion' = 'motion';

    private tableKeys: TableKey[] = [
        {
            vote: 'yes',
            icon: 'thumb_up',
            canHide: false,
            showPercent: true
        },
        {
            vote: 'no',
            icon: 'thumb_down',
            canHide: false,
            showPercent: true
        },
        {
            vote: 'abstain',
            icon: 'trip_origin',
            canHide: false,
            showPercent: true
        }
    ];

    private voteKeys: TableKey[] = [
        {
            vote: 'votesvalid',
            canHide: true,
            showPercent: this.poll.isPercentBaseValidOrCast
        },
        {
            vote: 'votesinvalid',
            canHide: true,
            showPercent: this.poll.isPercentBaseValidOrCast
        },
        {
            vote: 'votescast',
            canHide: true,
            showPercent: this.poll.isPercentBaseValidOrCast
        }
    ];

    public get result(): ViewMotionOption {
        return this.options[0];
    }

    public get hasVotes(): boolean {
        return !!this.result.votes.length;
    }

    public initChartLabels(): string[] {
        return ['Votes'];
    }

    public getContentObject(): BaseViewModel {
        return this.motion;
    }

    public generateTableData(): PollData[] {
        let tableData = this.options.flatMap(vote =>
            this.tableKeys.map(key => ({
                key: key.vote,
                value: vote[key.vote],
                canHide: key.canHide,
                icon: key.icon,
                showPercent: key.showPercent
            }))
        );
        tableData.push(
            ...this.voteKeys.map(key => ({ key: key.vote, value: this[key.vote], showPercent: key.showPercent }))
        );
        tableData = tableData.filter(entry => entry.canHide === false || entry.value || entry.value !== -2);
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

    public anySpecialVotes(): boolean {
        return this.result.yes < 0 || this.result.no < 0 || this.result.abstain < 0;
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

    public getPercentBase(): number {
        const base: PercentBase = this.poll.onehundred_percent_base;

        let totalByBase: number;
        switch (base) {
            case PercentBase.YN:
                if (this.result.yes >= 0 && this.result.no >= 0) {
                    totalByBase = this.result.sumYN();
                }
                break;
            case PercentBase.YNA:
                if (this.result.yes >= 0 && this.result.no >= 0 && this.result.abstain >= 0) {
                    totalByBase = this.result.sumYNA();
                }
                break;
            case PercentBase.Valid:
                // auslagern
                if (this.result.yes >= 0 && this.result.no >= 0 && this.result.abstain >= 0) {
                    totalByBase = this.poll.votesvalid;
                }
                break;
            case PercentBase.Cast:
                totalByBase = this.poll.votescast;
                break;
            case PercentBase.Disabled:
                break;
            default:
                throw new Error('The given poll has no percent base: ' + this);
        }

        return totalByBase;
    }
}

export interface ViewMotionPoll extends MotionPoll {
    motion: ViewMotion;
    options: ViewMotionOption[];
}
