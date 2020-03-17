import { Pipe, PipeTransform } from '@angular/core';

const PollValues = {
    votesvalid: 'Valid votes',
    votesinvalid: 'Invalid votes',
    votescast: 'Total votes cast',
    votesno: 'Votes No',
    votesabstain: 'Votes abstain',
    yes: 'Yes',
    no: 'No',
    abstain: 'Abstain',
    amount_global_abstain: 'General Abstain',
    amount_global_no: 'General No'
};

/**
 * Pipe to transform a key from polls into a speaking word.
 */
@Pipe({
    name: 'pollKeyVerbose'
})
export class PollKeyVerbosePipe implements PipeTransform {
    public transform(value: string): string {
        return PollValues[value] || value;
    }
}
