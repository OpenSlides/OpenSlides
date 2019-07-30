import { AssignmentPoll } from 'app/shared/models/assignments/assignment-poll';
import { AssignmentPollMethod } from '../services/assignment-poll.service';
import { ViewAssignmentPollOption } from './view-assignment-poll-option';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import { BaseProjectableViewModel } from 'app/site/base/base-projectable-view-model';
import { AssignmentPollOption } from 'app/shared/models/assignments/assignment-poll-option';

export class ViewAssignmentPoll extends BaseProjectableViewModel<AssignmentPoll> {
    public static COLLECTIONSTRING = AssignmentPoll.COLLECTIONSTRING;
    private _options: ViewAssignmentPollOption[];

    public get poll(): AssignmentPoll {
        return this._model;
    }

    public get options(): ViewAssignmentPollOption[] {
        return this._options;
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

    public get votesno(): number {
        return this.poll.votesno;
    }
    public set votesno(amount: number) {
        this.poll.votesno = amount;
    }

    public get votesabstain(): number {
        return this.poll.votesabstain;
    }
    public set votesabstain(amount: number) {
        this.poll.votesabstain = amount;
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

    public constructor(assignmentPoll: AssignmentPoll) {
        super(AssignmentPoll.COLLECTIONSTRING, assignmentPoll);
    }

    public getTitle = () => {
        return 'Poll';
    };

    public getListTitle = () => {
        return this.getTitle();
    };

    public getProjectorTitle = () => {
        return this.getTitle();
    };

    /**
     * Creates a copy with deep-copy on all changing numerical values,
     * but intact uncopied references to the users
     *
     * TODO: This MUST NOT be done this way. Do not create ViewModels on your own...
     */
    public copy(): ViewAssignmentPoll {
        const poll = new ViewAssignmentPoll(new AssignmentPoll(JSON.parse(JSON.stringify(this.poll))));
        (<any>poll)._options = this.options.map(option => {
            const polloption = new ViewAssignmentPollOption(
                new AssignmentPollOption(JSON.parse(JSON.stringify(option.option)))
            );
            (<any>polloption)._user = option.user;
            return polloption;
        });
        return poll;
    }

    public getSlide(): ProjectorElementBuildDeskriptor {
        return {
            getBasicProjectorElement: options => ({
                name: 'assignments/poll',
                assignment_id: this.assignment_id,
                poll_id: this.id,
                getIdentifiers: () => ['name', 'assignment_id', 'poll_id']
            }),
            slideOptions: [],
            projectionDefaultName: 'assignments',
            getDialogTitle: () => 'TODO'
        };
    }
}
