import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { RelationManagerService } from 'app/core/core-services/relation-manager.service';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { RelationDefinition } from 'app/core/definitions/relations';
import { ChatMessage } from 'app/shared/models/chat/chat-message';
import { ViewChatGroup } from 'app/site/chat/models/view-chat-group';
import { ChatMessageTitleInformation, ViewChatMessage } from 'app/site/chat/models/view-chat-message';
import { BaseRepository } from '../base-repository';
import { CollectionStringMapperService } from '../../core-services/collection-string-mapper.service';
import { DataSendService } from '../../core-services/data-send.service';
import { DataStoreService } from '../../core-services/data-store.service';

const ChatMessageRelations: RelationDefinition[] = [
    {
        type: 'M2M',
        ownIdKey: 'chatgroup_id',
        ownKey: 'chatgroup',
        foreignViewModel: ViewChatGroup
    }
];

@Injectable({
    providedIn: 'root'
})
export class ChatMessageRepositoryService extends BaseRepository<
    ViewChatMessage,
    ChatMessage,
    ChatMessageTitleInformation
> {
    public constructor(
        DS: DataStoreService,
        dataSend: DataSendService,
        mapperService: CollectionStringMapperService,
        viewModelStoreService: ViewModelStoreService,
        translate: TranslateService,
        relationManager: RelationManagerService
    ) {
        super(
            DS,
            dataSend,
            mapperService,
            viewModelStoreService,
            translate,
            relationManager,
            ChatMessage,
            ChatMessageRelations
        );
        this.initSorting();
    }

    public getTitle = (titleInformation: ChatMessageTitleInformation) => {
        return 'Chat message';
    };

    public getVerboseName = (plural: boolean = false) => {
        return this.translate.instant(plural ? 'Chat messages' : 'Chat message');
    };

    private initSorting(): void {
        this.setSortFunction((a: ViewChatMessage, b: ViewChatMessage) => {
            return a.timestampAsDate > b.timestampAsDate ? 1 : -1;
        });
    }
}
