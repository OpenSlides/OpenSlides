import { Component, Input } from '@angular/core';

import { AssignmentPollService, SummaryPollKey } from 'app/site/assignments/services/assignment-poll.service';
import { BaseSlideComponent } from 'app/slides/base-slide-component';
import { PollSlideData } from './poll-slide-data';
import { SlideData } from 'app/core/core-services/projector-data.service';

@Component({
    selector: 'os-poll-slide',
    templateUrl: './poll-slide.component.html',
    styleUrls: ['./poll-slide.component.scss']
})
export class PollSlideComponent extends BaseSlideComponent<PollSlideData> {
    private _data: SlideData<PollSlideData>;

    public pollValues: SummaryPollKey[] = ['votesno', 'votesabstain', 'votesvalid', 'votesinvalid', 'votescast'];

    @Input()
    public set data(data: SlideData<PollSlideData>) {
        this._data = data;
        this.setPercents();
    }

    public get data(): SlideData<PollSlideData> {
        return this._data;
    }

    public constructor(private pollService: AssignmentPollService) {
        super();
    }

    public getVoteString(rawValue: string): string {
        const num = parseFloat(rawValue);
        if (!isNaN(num)) {
            return this.pollService.getSpecialLabel(num);
        }
        return '-';
    }

    private setPercents(): void {
        if (
            this.data.data.assignments_poll_100_percent_base === 'DISABLED' ||
            !this.data.data.poll.has_votes ||
            !this.data.data.poll.options.length
        ) {
            return;
        }
        for (const option of this.data.data.poll.options) {
            for (const vote of option.votes) {
                const voteweight = parseFloat(vote.weight);
                if (isNaN(voteweight) || voteweight < 0) {
                    return;
                }
                let base: number;
                switch (this.data.data.assignments_poll_100_percent_base) {
                    case 'CAST':
                        base = this.data.data.poll.votescast ? parseFloat(this.data.data.poll.votescast) : 0;
                        break;
                    case 'VALID':
                        base = this.data.data.poll.votesvalid ? parseFloat(this.data.data.poll.votesvalid) : 0;
                        break;
                    case 'YES_NO':
                    case 'YES_NO_ABSTAIN':
                        const yesOption = option.votes.find(v => v.value === 'Yes');
                        const yes = yesOption ? parseFloat(yesOption.weight) : -1;
                        const noOption = option.votes.find(v => v.value === 'No');
                        const no = noOption ? parseFloat(noOption.weight) : -1;
                        const absOption = option.votes.find(v => v.value === 'Abstain');
                        const abs = absOption ? parseFloat(absOption.weight) : -1;
                        if (this.data.data.assignments_poll_100_percent_base === 'YES_NO_ABSTAIN') {
                            base = yes >= 0 && no >= 0 && abs >= 0 ? yes + no + abs : 0;
                        } else {
                            if (vote.value !== 'Abstain') {
                                base = yes >= 0 && no >= 0 ? yes + no : 0;
                            }
                        }
                        break;
                    default:
                        break;
                }
                if (base) {
                    vote.percent = `${Math.round(((parseFloat(vote.weight) * 100) / base) * 100) / 100}%`;
                }
            }
        }
    }

    /**
     * Converts a number-like string to a simpler, more readable version
     *
     * @param input a server-sent string representing a numerical value
     * @returns either the special label or a cleaned-up number of the inpu string
     */
    public labelValue(input: string): string {
        return this.pollService.getSpecialLabel(parseFloat(input));
    }
}
