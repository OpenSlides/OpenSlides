import { Injectable } from '@angular/core';
import { DataStoreService } from '../../core-services/data-store.service';
import { BaseRepository } from '../base-repository';
import { Identifiable } from 'app/shared/models/base/identifiable';
import { CollectionStringMapperService } from '../../core-services/collectionStringMapper.service';
import { ChatMessage } from 'app/shared/models/core/chat-message';
import { ViewChatMessage } from 'app/site/common/models/view-chatmessage';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
    providedIn: 'root'
})
export class ChatMessageRepositoryService extends BaseRepository<ViewChatMessage, ChatMessage> {
    public constructor(
        DS: DataStoreService,
        mapperService: CollectionStringMapperService,
        viewModelStoreService: ViewModelStoreService,
        private translate: TranslateService
    ) {
        super(DS, mapperService, viewModelStoreService, ChatMessage);
    }

    protected createViewModel(message: ChatMessage): ViewChatMessage {
        const viewChatMessage = new ViewChatMessage(message);
        viewChatMessage.getVerboseName = (plural: boolean = false) => {
            return this.translate.instant(plural ? 'Chatmessages' : 'Chatmessage');
        };
        return viewChatMessage;
    }

    public async create(message: ChatMessage): Promise<Identifiable> {
        throw new Error('TODO');
    }

    public async update(message: Partial<ChatMessage>, viewMessage: ViewChatMessage): Promise<void> {
        throw new Error('TODO');
    }

    public async delete(viewMessage: ViewChatMessage): Promise<void> {
        throw new Error('TODO');
    }
}
