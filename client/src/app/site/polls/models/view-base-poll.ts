
import { ChartData } from 'app/shared/components/charts/charts.component';
import { BasePoll, PollState } from 'app/shared/models/poll/base-poll';
import { ViewAssignmentOption } from 'app/site/assignments/models/view-assignment-option';
import { ViewAssignmentPoll } from 'app/site/assignments/models/view-assignment-poll';
import { BaseProjectableViewModel } from 'app/site/base/base-projectable-view-model';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import { ViewMotionOption } from 'app/site/motions/models/view-motion-option';
import { ViewMotionPoll } from 'app/site/motions/models/view-motion-poll';
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
    analog: 'Analog',
    named: 'Named',
    pseudoanonymous: 'Pseudoanonymous'
};

export const PollPropertyVerbose = {
    majority_method: 'Majority method',
    onehundred_percent_base: '100% base',
    type: 'Poll type',
    pollmethod: 'Poll method',
    state: 'State',
    groups: 'Entitled to vote'
};

export const MajorityMethodVerbose = {
    simple: 'Simple',
    two_thirds: 'Two Thirds',
    three_quarters: 'Three Quarters',
    disabled: 'Disabled'
};

export const PercentBaseVerbose = {
    YN: 'Yes/No',
    YNA: 'Yes/No/Abstain',
    votes: 'All votes',
    valid: 'Valid votes',
    cast: 'Cast votes',
    disabled: 'Disabled'
};

export abstract class ViewBasePoll<M extends BasePoll<M, any> = any> extends BaseProjectableViewModel<M> {
    public candidatesLabels: string[] = [];

    public get labels(): string[] {
        if (!this.candidatesLabels.length) {
            this.initChartLabels();
        }
        return this.candidatesLabels;
    }

    public get poll(): M {
        return this._model;
    }

    public get pollClassTypeVerbose(): string {
        return PollClassTypeVerbose[this.pollClassType];
    }

    public get parentLink(): string {
        return this.pollClassType === 'motion'
            ? `/motions/${(<ViewMotionPoll>(<any>this)).poll.motion_id}`
            : `/assignments/${(<ViewAssignmentPoll>(<any>this)).poll.assignment_id}/`;
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

    /**
     * Initializes labels for a chart.
     */
    public abstract initChartLabels(): void;

    public abstract generateChartData(): ChartData;
}

export interface ViewBasePoll<M extends BasePoll<M, any> = any> extends BasePoll<M, any> {
    voted: ViewUser[];
    groups: ViewGroup[];
    options: ViewMotionOption[] | ViewAssignmentOption[]; // TODO find a better solution. but works for the moment
}
