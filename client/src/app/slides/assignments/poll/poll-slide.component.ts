import { Component, Input } from '@angular/core';

import { SlideData } from 'app/core/core-services/projector-data.service';
import { CalculablePollKey, PollVoteValue } from 'app/site/polls/services/poll.service';
import { BaseSlideComponent } from 'app/slides/base-slide-component';
import { PollSlideData, PollSlideOption } from './poll-slide-data';

@Component({
    selector: 'os-poll-slide',
    templateUrl: './poll-slide.component.html',
    styleUrls: ['./poll-slide.component.scss']
})
export class PollSlideComponent extends BaseSlideComponent<PollSlideData> {
    private _data: SlideData<PollSlideData>;

    public get pollValues(): any {
        // SummaryPollKey[] {
        if (!this.data) {
            return [];
        }
        const values: any /*SummaryPollKey[]*/ = ['votesno', 'votesabstain', 'votesvalid', 'votesinvalid', 'votescast'];
        return values.filter(val => this.data.data.poll[val] !== null);
    }

    @Input()
    public set data(data: SlideData<PollSlideData>) {
        this._data = data;
        /*this.calculationData = {
            pollMethod: data.data.poll.pollmethod,
            votesno: parseFloat(data.data.poll.votesno),
            votesabstain: parseFloat(data.data.poll.votesabstain),
            votescast: parseFloat(data.data.poll.votescast),
            votesvalid: parseFloat(data.data.poll.votesvalid),
            votesinvalid: parseFloat(data.data.poll.votesinvalid),
            pollOptions: data.data.poll.options.map(opt => {
                return {
                    votes: opt.votes.map(vote => {
                        return {
                            weight: parseFloat(vote.weight),
                            value: vote.value
                        };
                    })
                };
            }),
            percentBase: data.data.assignments_poll_100_percent_base
        };*/
    }

    public get data(): SlideData<PollSlideData> {
        return this._data;
    }

    /**
     * get a vote's numerical or special label, including percent values if these are to
     * be displayed
     *
     * @param key
     * @param option
     */
    public getVotePercent(key: PollVoteValue, option: PollSlideOption): string {
        /*const calcOption = {
            votes: option.votes.map(vote => {
                return { weight: parseFloat(vote.weight), value: vote.value };
            })
        };
        const percent = this.pollService.getPercent(this.calculationData, calcOption, key);
        const number = this.translate.instant(
            this.pollService.getSpecialLabel(parseFloat(option.votes.find(v => v.value === key).weight))
        );
        return percent === null ? number : `${number} (${percent}%)`;*/
        throw new Error('TODO');
    }

    public getPollPercent(key: CalculablePollKey): string {
        /*const percent = this.pollService.getValuePercent(this.calculationData, key);
        const number = this.translate.instant(this.pollService.getSpecialLabel(this.calculationData[key]));
        return percent === null ? number : `${number} (${percent}%)`;*/
        throw new Error('TODO');
    }

    /**
     * @returns a translated label for a key
     */
    public getLabel(key: CalculablePollKey): string {
        // return this.translate.instant(this.pollService.getLabel(key));
        throw new Error('TODO');
    }
}
