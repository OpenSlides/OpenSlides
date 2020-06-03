import { TranslateService } from '@ngx-translate/core';

import { CollectionStringMapperService } from 'app/core/core-services/collection-string-mapper.service';
import { DataSendService } from 'app/core/core-services/data-send.service';
import { DataStoreService } from 'app/core/core-services/data-store.service';
import { HttpService } from 'app/core/core-services/http.service';
import { RelationManagerService } from 'app/core/core-services/relation-manager.service';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { RelationDefinition } from 'app/core/definitions/relations';
import { BaseRepository, NestedModelDescriptors } from 'app/core/repositories/base-repository';
import { VotingService } from 'app/core/ui-services/voting.service';
import { ModelConstructor } from 'app/shared/models/base/base-model';
import { BasePoll, PollState } from 'app/shared/models/poll/base-poll';
import { BaseViewModel, TitleInformation } from 'app/site/base/base-view-model';
import { ViewBasePoll } from '../models/view-base-poll';

export abstract class BasePollRepositoryService<
    V extends ViewBasePoll & T = any,
    M extends BasePoll = any,
    T extends TitleInformation = any
> extends BaseRepository<V, M, T> {
    // just passing everything to superclass
    public constructor(
        protected DS: DataStoreService,
        protected dataSend: DataSendService,
        protected collectionStringMapperService: CollectionStringMapperService,
        protected viewModelStoreService: ViewModelStoreService,
        protected translate: TranslateService,
        protected relationManager: RelationManagerService,
        protected baseModelCtor: ModelConstructor<M>,
        protected relationDefinitions: RelationDefinition<BaseViewModel>[] = [],
        protected nestedModelDescriptors: NestedModelDescriptors = {},
        private votingService: VotingService,
        protected http: HttpService
    ) {
        super(
            DS,
            dataSend,
            collectionStringMapperService,
            viewModelStoreService,
            translate,
            relationManager,
            baseModelCtor,
            relationDefinitions,
            nestedModelDescriptors
        );
    }

    /**
     * overwrites the view model creation to insert the `canBeVotedFor` property
     * @param model the model
     */
    protected createViewModelWithTitles(model: M): V {
        const viewModel = super.createViewModelWithTitles(model);
        Object.defineProperty(viewModel, 'canBeVotedFor', {
            value: () => this.votingService.canVote(viewModel)
        });
        return viewModel;
    }

    public changePollState(poll: BasePoll): Promise<void> {
        const path = this.restPath(poll);
        switch (poll.state) {
            case PollState.Created:
                return this.http.post(`${path}/start/`);
            case PollState.Started:
                return this.http.post(`${path}/stop/`);
            case PollState.Finished:
                return this.http.post(`${path}/publish/`);
            case PollState.Published:
                return this.resetPoll(poll);
        }
    }

    private restPath(poll: BasePoll): string {
        return `/rest/${poll.collectionString}/${poll.id}`;
    }

    public resetPoll(poll: BasePoll): Promise<void> {
        return this.http.post(`${this.restPath(poll)}/reset/`);
    }

    public pseudoanonymize(poll: BasePoll): Promise<void> {
        return this.http.post(`${this.restPath(poll)}/pseudoanonymize/`);
    }

    public refresh(poll: BasePoll): Promise<void> {
        return this.http.post(`${this.restPath(poll)}/refresh/`);
    }
}
