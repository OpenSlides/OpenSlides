import { BaseViewModel } from 'app/site/base/base-view-model';
import { Updateable } from 'app/site/base/updateable';
import { Identifiable } from 'app/shared/models/base/identifiable';
import { AssignmentPoll } from 'app/shared/models/assignments/assignment-poll';
import { AssignmentPollMethod } from '../services/assignment-poll.service';
import { ViewAssignmentPollOption } from './view-assignment-poll-option';
import { AssignmentPollOption } from 'app/shared/models/assignments/assignment-poll-option';

export class ViewAssignmentPoll implements Identifiable, Updateable {
    private _assignmentPoll: AssignmentPoll;
    private _assignmentPollOptions: ViewAssignmentPollOption[];

    public get poll(): AssignmentPoll {
        return this._assignmentPoll;
    }

    public get options(): ViewAssignmentPollOption[] {
        return this._assignmentPollOptions;
    }

    public get id(): number {
        return this.poll.id;
    }

    public get pollmethod(): AssignmentPollMethod {
        return this.poll.pollmethod;
    }

    public get description(): string {
        return this.poll.description;
    }

    public get published(): boolean {
        return this.poll.published;
    }

    public get votesvalid(): number {
        return this.poll.votesvalid;
    }

    public set votesvalid(amount: number) {
        this.poll.votesvalid = amount;
    }

    public get votesinvalid(): number {
        return this.poll.votesinvalid;
    }
    public set votesinvalid(amount: number) {
        this.poll.votesinvalid = amount;
    }

    public get votescast(): number {
        return this.poll.votescast;
    }

    public set votescast(amount: number) {
        this.poll.votescast = amount;
    }

    public get has_votes(): boolean {
        return this.poll.has_votes;
    }

    public get assignment_id(): number {
        return this.poll.assignment_id;
    }

    /**
     * storing the base values for percentage calculations,
     * to avoid recalculating pollBases too often
     * (the calculation iterates through all pollOptions in some use cases)
     */
    public pollBase: number;

    public constructor(assignmentPoll: AssignmentPoll, assignmentPollOptions: ViewAssignmentPollOption[]) {
        this._assignmentPoll = assignmentPoll;
        this._assignmentPollOptions = assignmentPollOptions;
    }

    public updateDependencies(update: BaseViewModel): void {
        this.options.forEach(option => option.updateDependencies(update));
    }

    /**
     * Creates a copy with deep-copy on all changing numerical values,
     * but intact uncopied references to the users
     *
     * TODO check and review
     */
    public copy(): ViewAssignmentPoll {
        return new ViewAssignmentPoll(
            new AssignmentPoll(JSON.parse(JSON.stringify(this._assignmentPoll))),
            this._assignmentPollOptions.map(option => {
                return new ViewAssignmentPollOption(
                    new AssignmentPollOption(JSON.parse(JSON.stringify(option.option))),
                    option.user
                );
            })
        );
    }
}
