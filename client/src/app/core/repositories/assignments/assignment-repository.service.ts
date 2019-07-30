import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { Assignment } from 'app/shared/models/assignments/assignment';
import { CollectionStringMapperService } from '../../core-services/collection-string-mapper.service';
import { DataSendService } from 'app/core/core-services/data-send.service';
import { DataStoreService } from '../../core-services/data-store.service';
import { HttpService } from 'app/core/core-services/http.service';
import { AssignmentPoll } from 'app/shared/models/assignments/assignment-poll';
import { ViewAssignment, AssignmentTitleInformation } from 'app/site/assignments/models/view-assignment';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { ViewTag } from 'app/site/tags/models/view-tag';
import { ViewUser } from 'app/site/users/models/view-user';
import { ViewAssignmentRelatedUser } from 'app/site/assignments/models/view-assignment-related-user';
import { ViewAssignmentPoll } from 'app/site/assignments/models/view-assignment-poll';
import { BaseIsAgendaItemAndListOfSpeakersContentObjectRepository } from '../base-is-agenda-item-and-list-of-speakers-content-object-repository';
import { RelationDefinition } from '../base-repository';
import { ViewMediafile } from 'app/site/mediafiles/models/view-mediafile';
import { ViewAssignmentPollOption } from 'app/site/assignments/models/view-assignment-poll-option';

const AssignmentRelations: RelationDefinition[] = [
    {
        type: 'M2M',
        ownIdKey: 'tags_id',
        ownKey: 'tags',
        foreignModel: ViewTag
    },
    {
        type: 'M2M',
        ownIdKey: 'attachments_id',
        ownKey: 'attachments',
        foreignModel: ViewMediafile
    },
    {
        type: 'nested',
        ownKey: 'assignment_related_users',
        foreignModel: ViewAssignmentRelatedUser,
        order: 'weight',
        relationDefinition: [
            {
                type: 'O2M',
                ownIdKey: 'user_id',
                ownKey: 'user',
                foreignModel: ViewUser
            }
        ]
    },
    {
        type: 'nested',
        ownKey: 'polls',
        foreignModel: ViewAssignmentPoll,
        relationDefinition: [
            {
                type: 'nested',
                ownKey: 'options',
                foreignModel: ViewAssignmentPollOption,
                order: 'weight',
                relationDefinition: [
                    {
                        type: 'O2M',
                        ownIdKey: 'user_id',
                        ownKey: 'user',
                        foreignModel: ViewUser
                    }
                ]
            }
        ]
    }
];

/**
 * Repository Service for Assignments.
 *
 * Documentation partially provided in {@link BaseRepository}
 */
@Injectable({
    providedIn: 'root'
})
export class AssignmentRepositoryService extends BaseIsAgendaItemAndListOfSpeakersContentObjectRepository<
    ViewAssignment,
    Assignment,
    AssignmentTitleInformation
> {
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
        super(DS, dataSend, mapperService, viewModelStoreService, translate, Assignment, AssignmentRelations);
    }

    public getTitle = (titleInformation: AssignmentTitleInformation) => {
        return titleInformation.title;
    };

    public getVerboseName = (plural: boolean = false) => {
        return this.translate.instant(plural ? 'Elections' : 'Election');
    };

    /**
     * Adds/removes another user to/from the candidates list of an assignment
     *
     * @param user A ViewUser
     * @param assignment The assignment to add the candidate to
     * @param adding optional boolean to force an add (true)/ remove (false)
     * of the candidate. Else, the candidate will be added if not on the list,
     * and removed if on the list
     */
    public async changeCandidate(user: ViewUser, assignment: ViewAssignment, adding?: boolean): Promise<void> {
        const data = { user: user.id };
        if (assignment.candidates.some(candidate => candidate.id === user.id) && adding !== true) {
            await this.httpService.delete(this.restPath + assignment.id + this.candidatureOtherPath, data);
        } else if (adding !== false) {
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
        // TODO: change current tab to new poll
    }

    /**
     * Deletes a poll
     *
     * @param id id of the poll to delete
     */
    public async deletePoll(poll: ViewAssignmentPoll): Promise<void> {
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
    public async updatePoll(poll: Partial<AssignmentPoll>, originalPoll: ViewAssignmentPoll): Promise<void> {
        const data: AssignmentPoll = Object.assign(originalPoll.poll, poll);
        await this.httpService.patch(`${this.restPollPath}${originalPoll.id}/`, data);
    }

    /**
     * TODO: temporary (?) update votes method. Needed because server needs
     * different input than it's output in case of votes ?
     *
     * @param poll the updated Poll
     * @param originalPoll the original poll
     */
    public async updateVotes(poll: Partial<AssignmentPoll>, originalPoll: ViewAssignmentPoll): Promise<void> {
        poll.options.sort((a, b) => a.weight - b.weight);
        const votes = poll.options.map(option => {
            switch (poll.pollmethod) {
                case 'votes':
                    return { Votes: option.votes.find(v => v.value === 'Votes').weight };
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
            votesabstain: poll.votesabstain || null,
            votescast: poll.votescast || null,
            votesinvalid: poll.votesinvalid || null,
            votesno: poll.votesno || null,
            votesvalid: poll.votesvalid || null
        };
        await this.httpService.put(`${this.restPollPath}${originalPoll.id}/`, data);
    }

    /**
     * change the 'elected' state of an election candidate
     *
     * @param assignmentRelatedUser
     * @param assignment
     * @param elected true if the candidate is to be elected, false if unelected
     */
    public async markElected(
        assignmentRelatedUser: ViewAssignmentRelatedUser,
        assignment: ViewAssignment,
        elected: boolean
    ): Promise<void> {
        const data = { user: assignmentRelatedUser.user_id };
        if (elected) {
            await this.httpService.post(this.restPath + assignment.id + this.markElectedPath, data);
        } else {
            await this.httpService.delete(this.restPath + assignment.id + this.markElectedPath, data);
        }
    }

    /**
     * Sends a request to sort an assignment's candidates
     *
     * @param sortedCandidates the id of the assignment related users (note: NOT viewUsers)
     * @param assignment
     */
    public async sortCandidates(sortedCandidates: number[], assignment: ViewAssignment): Promise<void> {
        const restPath = `/rest/assignments/assignment/${assignment.id}/sort_related_users/`;
        const data = { related_users: sortedCandidates };
        await this.httpService.post(restPath, data);
    }
}
