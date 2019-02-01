import { Injectable } from '@angular/core';
import { DataStoreService } from '../../core-services/data-store.service';
import { BaseRepository } from '../base-repository';
import { Identifiable } from 'app/shared/models/base/identifiable';
import { CollectionStringMapperService } from '../../core-services/collectionStringMapper.service';
import { ChatMessage } from 'app/shared/models/core/chat-message';
import { ViewChatMessage } from 'app/site/common/models/view-chatmessage';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';

@Injectable({
    providedIn: 'root'
})
export class ChatMessageRepositoryService extends BaseRepository<ViewChatMessage, ChatMessage> {
    public constructor(
        DS: DataStoreService,
        mapperService: CollectionStringMapperService,
        viewModelStoreService: ViewModelStoreService
    ) {
        super(DS, mapperService, viewModelStoreService, ChatMessage);
    }

    protected createViewModel(message: ChatMessage): ViewChatMessage {
        return new ViewChatMessage(message);
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
