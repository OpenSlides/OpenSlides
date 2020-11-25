import { Pipe, PipeTransform } from '@angular/core';

import { marker as _ } from '@biesbjerg/ngx-translate-extract-marker';

const PollValues = {
    votesvalid: 'Valid votes',
    votesinvalid: 'Invalid votes',
    votescast: 'Total votes cast',
    votesno: 'Votes No',
    votesabstain: 'Votes abstain',
    yes: 'Yes',
    no: 'No',
    abstain: 'Abstain',
    amount_global_yes: _('General approval'),
    amount_global_no: _('General rejection'),
    amount_global_abstain: _('General abstain')
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
