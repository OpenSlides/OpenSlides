import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { DataSendService } from 'app/core/core-services/data-send.service';
import { HttpService } from 'app/core/core-services/http.service';
import { RelationManagerService } from 'app/core/core-services/relation-manager.service';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { RelationDefinition } from 'app/core/definitions/relations';
import { Assignment } from 'app/shared/models/assignments/assignment';
import { AssignmentRelatedUser } from 'app/shared/models/assignments/assignment-related-user';
import { AssignmentTitleInformation, ViewAssignment } from 'app/site/assignments/models/view-assignment';
import { ViewAssignmentPoll } from 'app/site/assignments/models/view-assignment-poll';
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
    },
    {
        type: 'O2M',
        ownKey: 'polls',
        foreignIdKey: 'assignment_id',
        foreignViewModel: ViewAssignmentPoll
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
    private readonly candidatureOtherPath = '/candidature_other/';
    private readonly candidatureSelfPath = '/candidature_self/';

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
