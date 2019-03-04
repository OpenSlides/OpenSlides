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
import { Tag } from 'app/shared/models/core/tag';
import { User } from 'app/shared/models/users/user';
import { ViewAssignment } from 'app/site/assignments/models/view-assignment';
import { ViewItem } from 'app/site/agenda/models/view-item';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { ViewTag } from 'app/site/tags/models/view-tag';
import { ViewUser } from 'app/site/users/models/view-user';
import { Poll } from 'app/shared/models/assignments/poll';

/**
 * Repository Service for Assignments.
 *
 * Documentation partially provided in {@link BaseRepository}
 */
@Injectable({
    providedIn: 'root'
})
export class AssignmentRepositoryService extends BaseAgendaContentObjectRepository<ViewAssignment, Assignment> {
    /**
     * Constructor for the Assignment Repository.
     *
     * @param DS The DataStore
     * @param mapperService Maps collection strings to classes
     * @param viewModelStoreService
     * @param translate
     * @param httpService
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
     * @param assignment
     */
    public async addCandidate(userId: number, assignment: ViewAssignment): Promise<void> {
        const restPath = `/rest/assignments/assignment/${assignment.id}/candidature_other/`;
        const data = { user: userId };
        await this.httpService.post(restPath, data);
    }

    /**
     * Removes an user from the list of candidates for an assignment
     *
     * @param user note: AssignmentUser, not a ViewUser
     * @param assignment
     */
    public async deleteCandidate(user: AssignmentUser, assignment: ViewAssignment): Promise<void> {
        const restPath = `/rest/assignments/assignment/${assignment.id}/candidature_other/`;
        const data = { user: user.id };
        await this.httpService.delete(restPath, data);
    }

    /**
     * Add the operator as candidate to the assignment
     *
     * @param assignment
     */
    public async addSelf(assignment: ViewAssignment): Promise<void> {
        const restPath = `/rest/assignments/assignment/${assignment.id}/candidature_self/`;
        await this.httpService.post(restPath);
    }

    /**
     * Removes the current user (operator) from the list of candidates for an assignment
     *
     * @param assignment
     */
    public async deleteSelf(assignment: ViewAssignment): Promise<void> {
        const restPath = `/rest/assignments/assignment/${assignment.id}/candidature_self/`;
        await this.httpService.delete(restPath);
    }

    /**
     * Creates a new Poll to a given assignment
     *
     * @param assignment
     */
    public async addPoll(assignment: ViewAssignment): Promise<void> {
        const restPath = `/rest/assignments/assignment/${assignment.id}/create_poll/`;
        await this.httpService.post(restPath);
        // TODO set phase, too, if phase was 0. Should be done server side?
    }

    /**
     * Deletes a poll
     *
     * @param id id of the poll to delete
     */
    public async deletePoll(poll: Poll): Promise<void> {
        const restPath = `/rest/assignments/poll/${poll.id}/`;
        await this.httpService.delete(restPath);
    }

    /**
     * update data (metadata etc) for a poll
     *
     * @param poll the (partial) data to update
     * @param originalPoll the poll to update
     *
     * TODO check if votes is untouched
     */
    public async updatePoll(poll: Partial<Poll>, originalPoll: Poll): Promise<void> {
        const restPath = `/rest/assignments/poll/${originalPoll.id}/`;
        const data: Poll = Object.assign(originalPoll, poll);
        await this.httpService.patch(restPath, data);
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
            votescast: null,
            votesinvalid: null,
            votesno: null,
            votesvalid: null
        };
        // TODO no response, no error shown, votes are not accepted
        const restPath = `/rest/assignments/poll/${originalPoll.id}/`;
        await this.httpService.put(restPath, data);
    }

    /**
     * change the 'elected' state of an election candidate
     *
     * @param user
     * @param assignment
     * @param elected true if the candidate is to be elected, false if unelected
     */
    public async markElected(user: AssignmentUser, assignment: ViewAssignment, elected: boolean): Promise<void> {
        const restPath = `/rest/assignments/assignment/${assignment.id}/mark_elected/`;
        const data = { user: user.user_id };
        if (elected) {
            await this.httpService.post(restPath, data);
        } else {
            await this.httpService.delete(restPath, data);
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
