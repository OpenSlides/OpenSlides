import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { HttpService } from 'app/core/core-services/http.service';
import { RelationManagerService } from 'app/core/core-services/relation-manager.service';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { RelationDefinition } from 'app/core/definitions/relations';
import { ChatGroup } from 'app/shared/models/chat/chat-group';
import { ChatGroupTitleInformation, ViewChatGroup } from 'app/site/chat/models/view-chat-group';
import { ViewChatMessage } from 'app/site/chat/models/view-chat-message';
import { ViewGroup } from 'app/site/users/models/view-group';
import { BaseRepository } from '../base-repository';
import { CollectionStringMapperService } from '../../core-services/collection-string-mapper.service';
import { DataSendService } from '../../core-services/data-send.service';
import { DataStoreService } from '../../core-services/data-store.service';

const ChatGroupRelations: RelationDefinition[] = [
    {
        type: 'M2M',
        ownIdKey: 'read_groups_id',
        ownKey: 'read_groups',
        foreignViewModel: ViewGroup
    },
    {
        type: 'M2M',
        ownIdKey: 'write_groups_id',
        ownKey: 'write_groups',
        foreignViewModel: ViewGroup
    }
];

@Injectable({
    providedIn: 'root'
})
export class ChatGroupRepositoryService extends BaseRepository<ViewChatGroup, ChatGroup, ChatGroupTitleInformation> {
    public constructor(
        DS: DataStoreService,
        dataSend: DataSendService,
        mapperService: CollectionStringMapperService,
        viewModelStoreService: ViewModelStoreService,
        translate: TranslateService,
        relationManager: RelationManagerService,
        private http: HttpService
    ) {
        super(
            DS,
            dataSend,
            mapperService,
            viewModelStoreService,
            translate,
            relationManager,
            ChatGroup,
            ChatGroupRelations
        );
        this.initSorting();
    }

    public getTitle = (titleInformation: ChatGroupTitleInformation) => {
        return titleInformation.name;
    };

    public getVerboseName = (plural: boolean = false) => {
        return this.translate.instant(plural ? 'Chat groups' : 'Chat group');
    };

    private initSorting(): void {
        this.setSortFunction((a: ViewChatGroup, b: ViewChatGroup) => {
            return this.languageCollator.compare(a.name, b.name);
        });
    }

    public async clearMessages(chatGroup: ViewChatGroup): Promise<void> {
        return this.http.post(`/rest/chat/chat-group/${chatGroup.id}/clear/`);
    }
}
