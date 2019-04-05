import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { Assignment } from 'app/shared/models/assignments/assignment';
import { AssignmentUser } from 'app/shared/models/assignments/assignment-user';
import { BaseAgendaContentObjectRepository } from '../base-agenda-content-object-repository';
import { CollectionStringMapperService } from '../../core-services/collectionStringMapper.service';
import { DataSendService } from 'app/core/core-services/data-send.service';
import { DataStoreService } from '../../core-services/data-store.service';
import { HttpService } from 'app/core/core-services/http.service';
import { Item } from 'app/shared/models/agenda/item';
import { Poll } from 'app/shared/models/assignments/poll';
import { Tag } from 'app/shared/models/core/tag';
import { User } from 'app/shared/models/users/user';
import { ViewAssignment } from 'app/site/assignments/models/view-assignment';
import { ViewItem } from 'app/site/agenda/models/view-item';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { ViewTag } from 'app/site/tags/models/view-tag';
import { ViewUser } from 'app/site/users/models/view-user';

/**
 * Repository Service for Assignments.
 *
 * Documentation partially provided in {@link BaseRepository}
 */
@Injectable({
    providedIn: 'root'
})
export class AssignmentRepositoryService extends BaseAgendaContentObjectRepository<ViewAssignment, Assignment> {
    private readonly restPath = '/rest/assignments/assignment/';
    private readonly restPollPath = '/rest/assignments/poll/';
    private readonly candidatureOtherPath = '/candidature_other/';
    private readonly candidatureSelfPath = '/candidature_self/';
    private readonly createPollPath = '/create_poll/';
    private readonly markElectedPath = '/mark_elected/';

    /**
     * Constructor for the Assignment Repository.
     *
     * @param DS DataStore access
     * @param dataSend Sending data
     * @param mapperService Map models to object
     * @param viewModelStoreService Access view models
     * @param translate Translate string
     * @param httpService make HTTP Requests
     */
    public constructor(
        DS: DataStoreService,
        dataSend: DataSendService,
        mapperService: CollectionStringMapperService,
        viewModelStoreService: ViewModelStoreService,
        protected translate: TranslateService,
        private httpService: HttpService
    ) {
        super(DS, dataSend, mapperService, viewModelStoreService, translate, Assignment, [User, Item, Tag]);
    }

    public getAgendaTitle = (assignment: Partial<Assignment> | Partial<ViewAssignment>) => {
        return assignment.title;
    };

    public getAgendaTitleWithType = (assignment: Partial<Assignment> | Partial<ViewAssignment>) => {
        return assignment.title + ' (' + this.getVerboseName() + ')';
    };

    public getVerboseName = (plural: boolean = false) => {
        return this.translate.instant(plural ? 'Elections' : 'Election');
    };

    public createViewModel(assignment: Assignment): ViewAssignment {
        const relatedUser = this.viewModelStoreService.getMany(ViewUser, assignment.candidates_id);
        const agendaItem = this.viewModelStoreService.get(ViewItem, assignment.agenda_item_id);
        const tags = this.viewModelStoreService.getMany(ViewTag, assignment.tags_id);

        const viewAssignment = new ViewAssignment(assignment, relatedUser, agendaItem, tags);
        viewAssignment.getVerboseName = this.getVerboseName;
        viewAssignment.getAgendaTitle = () => this.getAgendaTitle(viewAssignment);
        viewAssignment.getAgendaTitleWithType = () => this.getAgendaTitleWithType(viewAssignment);
        return viewAssignment;
    }

    /**
     * Adds another user as a candidate
     *
     * @param userId User id of a candidate
     * @param assignment The assignment to add the candidate to
     */
    public async changeCandidate(userId: number, assignment: ViewAssignment): Promise<void> {
        const data = { user: userId };
        if (assignment.candidates.some(candidate => candidate.id === userId)) {
            await this.httpService.delete(this.restPath + assignment.id + this.candidatureOtherPath, data);
        } else {
            await this.httpService.post(this.restPath + assignment.id + this.candidatureOtherPath, data);
        }
    }

    /**
     * Add the operator as candidate to the assignment
     *
     * @param assignment The assignment to add the candidate to
     */
    public async addSelf(assignment: ViewAssignment): Promise<void> {
        await this.httpService.post(this.restPath + assignment.id + this.candidatureSelfPath);
    }

    /**
     * Removes the current user (operator) from the list of candidates for an assignment
     *
     * @param assignment The assignment to remove ourself from
     */
    public async deleteSelf(assignment: ViewAssignment): Promise<void> {
        await this.httpService.delete(this.restPath + assignment.id + this.candidatureSelfPath);
    }

    /**
     * Creates a new Poll to a given assignment
     *
     * @param assignment The assignment to add the poll to
     */
    public async addPoll(assignment: ViewAssignment): Promise<void> {
        await this.httpService.post(this.restPath + assignment.id + this.createPollPath);
    }

    /**
     * Deletes a poll
     *
     * @param id id of the poll to delete
     */
    public async deletePoll(poll: Poll): Promise<void> {
        await this.httpService.delete(`${this.restPollPath}${poll.id}/`);
    }

    /**
     * update data (metadata etc) for a poll
     *
     * @param poll the (partial) data to update
     * @param originalPoll the poll to update
     *
     * TODO: check if votes is untouched
     */
    public async updatePoll(poll: Partial<Poll>, originalPoll: Poll): Promise<void> {
        const data: Poll = Object.assign(originalPoll, poll);
        await this.httpService.patch(`${this.restPollPath}${originalPoll.id}/`, data);
    }

    /**
     * TODO: temporary (?) update votes method. Needed because server needs
     * different input than it's output in case of votes ?
     *
     * @param poll the updated Poll
     * @param originalPoll the original poll
     */
    public async updateVotes(poll: Partial<Poll>, originalPoll: Poll): Promise<void> {
        poll.options.sort((a, b) => a.weight - b.weight);
        const votes = poll.options.map(option => {
            switch (poll.pollmethod) {
                case 'votes':
                    return { Votes: option.votes.find(v => v.value === 'Yes').weight };
                case 'yn':
                    return {
                        Yes: option.votes.find(v => v.value === 'Yes').weight,
                        No: option.votes.find(v => v.value === 'No').weight
                    };
                case 'yna':
                    return {
                        Yes: option.votes.find(v => v.value === 'Yes').weight,
                        No: option.votes.find(v => v.value === 'No').weight,
                        Abstain: option.votes.find(v => v.value === 'Abstain').weight
                    };
            }
        });
        const data = {
            assignment_id: originalPoll.assignment_id,
            votes: votes,
            votesabstain: null,
            votescast: poll.votescast || null,
            votesinvalid: poll.votesinvalid || null,
            votesno: null,
            votesvalid: poll.votesvalid || null
        };
        await this.httpService.put(`${this.restPollPath}${originalPoll.id}/`, data);
    }

    /**
     * change the 'elected' state of an election candidate
     *
     * @param user
     * @param assignment
     * @param elected true if the candidate is to be elected, false if unelected
     */
    public async markElected(user: AssignmentUser, assignment: ViewAssignment, elected: boolean): Promise<void> {
        const data = { user: user.user_id };
        if (elected) {
            await this.httpService.post(this.restPath + assignment.id + this.markElectedPath, data);
        } else {
            await this.httpService.delete(this.restPath + assignment.id + this.markElectedPath, data);
        }
    }

    /**
     * Sorting the candidates
     * TODO untested stub
     *
     * @param sortedCandidates
     * @param assignment
     */
    public async sortCandidates(sortedCandidates: any[], assignment: ViewAssignment): Promise<void> {
        throw Error('TODO');
        // const restPath = `/rest/assignments/assignment/${assignment.id}/sort_related_users`;
        // const data = { related_users: sortedCandidates };
        // await this.httpService.post(restPath, data);
    }
}
