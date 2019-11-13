import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { DataSendService } from 'app/core/core-services/data-send.service';
import { HttpService } from 'app/core/core-services/http.service';
import { RelationManagerService } from 'app/core/core-services/relation-manager.service';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { RelationDefinition } from 'app/core/definitions/relations';
import { VotingService } from 'app/core/ui-services/voting.service';
import { AssignmentPoll } from 'app/shared/models/assignments/assignment-poll';
import { ViewAssignment } from 'app/site/assignments/models/view-assignment';
import { ViewAssignmentOption } from 'app/site/assignments/models/view-assignment-option';
import { AssignmentPollTitleInformation, ViewAssignmentPoll } from 'app/site/assignments/models/view-assignment-poll';
import { BasePollRepositoryService } from 'app/site/polls/services/base-poll-repository.service';
import { ViewGroup } from 'app/site/users/models/view-group';
import { ViewUser } from 'app/site/users/models/view-user';
import { CollectionStringMapperService } from '../../core-services/collection-string-mapper.service';
import { DataStoreService } from '../../core-services/data-store.service';

const AssignmentPollRelations: RelationDefinition[] = [
    {
        type: 'M2M',
        ownIdKey: 'groups_id',
        ownKey: 'groups',
        foreignViewModel: ViewGroup
    },
    {
        type: 'M2M',
        ownIdKey: 'voted_id',
        ownKey: 'voted',
        foreignViewModel: ViewUser
    },
    {
        type: 'O2M',
        ownIdKey: 'options_id',
        ownKey: 'options',
        foreignViewModel: ViewAssignmentOption
    },
    {
        type: 'M2O',
        ownIdKey: 'assignment_id',
        ownKey: 'assignment',
        foreignViewModel: ViewAssignment
    }
];

export interface AssignmentAnalogVoteData {
    options: {
        [key: number]: {
            Y: number;
            N?: number;
            A?: number;
        };
    };
    votesvalid?: number;
    votesinvalid?: number;
    votescast?: number;
    global_no?: number;
    global_abstain?: number;
}

/**
 * Repository Service for Assignments.
 *
 * Documentation partially provided in {@link BaseRepository}
 */
@Injectable({
    providedIn: 'root'
})
export class AssignmentPollRepositoryService extends BasePollRepositoryService<
    ViewAssignmentPoll,
    AssignmentPoll,
    AssignmentPollTitleInformation
> {
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
        votingService: VotingService,
        http: HttpService
    ) {
        super(
            DS,
            dataSend,
            mapperService,
            viewModelStoreService,
            translate,
            relationManager,
            AssignmentPoll,
            AssignmentPollRelations,
            {},
            votingService,
            http
        );
    }

    public getTitle = (titleInformation: AssignmentPollTitleInformation) => {
        return titleInformation.title;
    };

    public getVerboseName = (plural: boolean = false) => {
        return this.translate.instant(plural ? 'Polls' : 'Poll');
    };

    public vote(data: any, poll_id: number): Promise<void> {
        return this.http.post(`/rest/assignments/assignment-poll/${poll_id}/vote/`, data);
    }
}
