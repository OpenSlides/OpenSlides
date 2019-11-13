import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { DataSendService } from 'app/core/core-services/data-send.service';
import { HttpService } from 'app/core/core-services/http.service';
import { RelationManagerService } from 'app/core/core-services/relation-manager.service';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { RelationDefinition } from 'app/core/definitions/relations';
import { Assignment } from 'app/shared/models/assignments/assignment';
import { AssignmentPoll } from 'app/shared/models/assignments/assignment-poll';
import { AssignmentPollOption } from 'app/shared/models/assignments/assignment-poll-option';
import { AssignmentRelatedUser } from 'app/shared/models/assignments/assignment-related-user';
import { AssignmentTitleInformation, ViewAssignment } from 'app/site/assignments/models/view-assignment';
import { ViewAssignmentPoll } from 'app/site/assignments/models/view-assignment-poll';
import { ViewAssignmentPollOption } from 'app/site/assignments/models/view-assignment-poll-option';
import { ViewAssignmentRelatedUser } from 'app/site/assignments/models/view-assignment-related-user';
import { ViewMediafile } from 'app/site/mediafiles/models/view-mediafile';
import { ViewTag } from 'app/site/tags/models/view-tag';
import { ViewUser } from 'app/site/users/models/view-user';
import { BaseIsAgendaItemAndListOfSpeakersContentObjectRepository } from '../base-is-agenda-item-and-list-of-speakers-content-object-repository';
import { NestedModelDescriptors } from '../base-repository';
import { CollectionStringMapperService } from '../../core-services/collection-string-mapper.service';
import { DataStoreService } from '../../core-services/data-store.service';

const AssignmentRelations: RelationDefinition[] = [
    {
        type: 'M2M',
        ownIdKey: 'tags_id',
        ownKey: 'tags',
        foreignViewModel: ViewTag
    },
    {
        type: 'M2M',
        ownIdKey: 'attachments_id',
        ownKey: 'attachments',
        foreignViewModel: ViewMediafile
    }
];

const AssignmentNestedModelDescriptors: NestedModelDescriptors = {
    'assignments/assignment': [
        {
            ownKey: 'assignment_related_users',
            foreignViewModel: ViewAssignmentRelatedUser,
            foreignModel: AssignmentRelatedUser,
            order: 'weight',
            relationDefinitionsByKey: {
                user: {
                    type: 'M2O',
                    ownIdKey: 'user_id',
                    ownKey: 'user',
                    foreignViewModel: ViewUser
                }
            },
            titles: {
                getTitle: (viewAssignmentRelatedUser: ViewAssignmentRelatedUser) =>
                    viewAssignmentRelatedUser.user ? viewAssignmentRelatedUser.user.getFullName() : ''
            }
        },
        {
            ownKey: 'polls',
            foreignViewModel: ViewAssignmentPoll,
            foreignModel: AssignmentPoll,
            relationDefinitionsByKey: {}
        }
    ],
    'assignments/assignment-poll': [
        {
            ownKey: 'options',
            foreignViewModel: ViewAssignmentPollOption,
            foreignModel: AssignmentPollOption,
            order: 'weight',
            relationDefinitionsByKey: {
                user: {
                    type: 'M2O',
                    ownIdKey: 'candidate_id',
                    ownKey: 'user',
                    foreignViewModel: ViewUser
                }
            }
        }
    ]
};

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
        translate: TranslateService,
        relationManager: RelationManagerService,
        private httpService: HttpService
    ) {
        super(
            DS,
            dataSend,
            mapperService,
            viewModelStoreService,
            translate,
            relationManager,
            Assignment,
            AssignmentRelations,
            AssignmentNestedModelDescriptors
        );
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
        const votes = poll.options.map(option => {
            const voteObject = {};
            for (const vote of option.votes) {
                voteObject[vote.value] = vote.weight;
            }
            return voteObject;
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
