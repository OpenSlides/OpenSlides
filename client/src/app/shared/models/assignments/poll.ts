import { PollOption } from './poll-option';
import { Deserializer } from '../deserializer.model';

/**
 * Content of the 'polls' property of assignments
 * @ignore
 */
export class Poll extends Deserializer {
    public id: number;
    public pollmethod: string;
    public description: string;
    public published: boolean;
    public options: PollOption[];
    public votesvalid: number;
    public votesinvalid: number;
    public votescast: number;
    public has_votes: boolean;
    public assignment_id: number;

    /**
     * Needs to be completely optional because assignment has (yet) the optional parameter 'polls'
     * @param input
     */
    public constructor(input?: any) {
        super(input);
    }

    public deserialize(input: any): void {
        Object.assign(this, input);

        this.options = [];
        if (input.options instanceof Array) {
            input.options.forEach(pollOptionData => {
                this.options.push(new PollOption(pollOptionData));
            });
        }
    }
}
