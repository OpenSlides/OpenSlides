import { ChartData } from 'app/shared/components/charts/charts.component';
import { BasePoll, PollState } from 'app/shared/models/poll/base-poll';
import { ViewAssignmentOption } from 'app/site/assignments/models/view-assignment-option';
import { BaseProjectableViewModel } from 'app/site/base/base-projectable-view-model';
import { BaseViewModel } from 'app/site/base/base-view-model';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import { ViewMotionOption } from 'app/site/motions/models/view-motion-option';
import { ViewGroup } from 'app/site/users/models/view-group';
import { ViewUser } from 'app/site/users/models/view-user';

export const PollClassTypeVerbose = {
    motion: 'Motion poll',
    assignment: 'Assignment poll'
};

export const PollStateVerbose = {
    1: 'Created',
    2: 'Started',
    3: 'Finished',
    4: 'Published'
};

export const PollTypeVerbose = {
    analog: 'Analog voting',
    named: 'Named voting',
    pseudoanonymous: 'Pseudoanonymous voting'
};

export const PollPropertyVerbose = {
    majority_method: 'Majority method',
    onehundred_percent_base: '100% base',
    type: 'Poll type',
    pollmethod: 'Poll method',
    state: 'State',
    groups: 'Entitled to vote',
    votes_amount: 'Amount of votes',
    global_no: 'Enable global no',
    global_abstain: 'Enable global abstain'
};

export const MajorityMethodVerbose = {
    simple: 'Simple majority',
    two_thirds: 'Two-thirds majority',
    three_quarters: 'Three-quarters majority',
    disabled: 'Disabled'
};

export const PercentBaseVerbose = {
    YN: 'Yes/No',
    YNA: 'Yes/No/Abstain',
    votes: 'All votes',
    valid: 'Valid votes',
    cast: 'Total votes cast',
    disabled: 'Disabled'
};

export abstract class ViewBasePoll<M extends BasePoll<M, any> = any> extends BaseProjectableViewModel<M> {
    private _tableData: {}[] = [];

    public get tableData(): {}[] {
        if (!this._tableData.length) {
            this._tableData = this.generateTableData();
        }
        return this._tableData;
    }

    public get poll(): M {
        return this._model;
    }

    public get pollClassTypeVerbose(): string {
        return PollClassTypeVerbose[this.pollClassType];
    }

    public get parentLink(): string {
        return `/${this.pollClassType}s/${this.getContentObject().id}`;
    }

    public get stateVerbose(): string {
        return PollStateVerbose[this.state];
    }

    public get typeVerbose(): string {
        return PollTypeVerbose[this.type];
    }

    public get majorityMethodVerbose(): string {
        return MajorityMethodVerbose[this.majority_method];
    }

    public get percentBaseVerbose(): string {
        return PercentBaseVerbose[this.onehundred_percent_base];
    }

    /**
     * returns a mapping "verbose_state" -> "state_id" for all valid next states
     */
    public get nextStates(): { [key: number]: string } {
        const next_state = (this.state % Object.keys(PollStateVerbose).length) + 1;
        const states = {};
        states[PollStateVerbose[next_state]] = next_state;
        if (this.state === PollState.Finished) {
            states[PollStateVerbose[PollState.Created]] = PollState.Created;
        }
        return states;
    }

    public abstract readonly pollClassType: 'motion' | 'assignment';

    public canBeVotedFor: () => boolean;

    public abstract getSlide(): ProjectorElementBuildDeskriptor;

    public abstract getContentObject(): BaseViewModel;

    /**
     * Initializes labels for a chart.
     */
    public abstract initChartLabels(): string[];

    public abstract generateChartData(): ChartData;

    public abstract generateTableData(): {}[];
}

export interface ViewBasePoll<M extends BasePoll<M, any> = any> extends BasePoll<M, any> {
    voted: ViewUser[];
    groups: ViewGroup[];
    options: ViewMotionOption[] | ViewAssignmentOption[]; // TODO find a better solution. but works for the moment
}
