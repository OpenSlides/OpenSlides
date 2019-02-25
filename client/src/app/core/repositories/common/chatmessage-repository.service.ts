import { Injectable } from '@angular/core';
import { DataStoreService } from '../../core-services/data-store.service';
import { BaseRepository } from '../base-repository';
import { CollectionStringMapperService } from '../../core-services/collectionStringMapper.service';
import { ChatMessage } from 'app/shared/models/core/chat-message';
import { ViewChatMessage } from 'app/site/common/models/view-chatmessage';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { TranslateService } from '@ngx-translate/core';
import { DataSendService } from 'app/core/core-services/data-send.service';

@Injectable({
    providedIn: 'root'
})
export class ChatMessageRepositoryService extends BaseRepository<ViewChatMessage, ChatMessage> {
    public constructor(
        DS: DataStoreService,
        dataSend: DataSendService,
        mapperService: CollectionStringMapperService,
        viewModelStoreService: ViewModelStoreService,
        translate: TranslateService
    ) {
        super(DS, dataSend, mapperService, viewModelStoreService, translate, ChatMessage);
    }

    public getVerboseName = (plural: boolean = false) => {
        return this.translate.instant(plural ? 'Chatmessages' : 'Chatmessage');
    };

    protected createViewModel(message: ChatMessage): ViewChatMessage {
        const viewChatMessage = new ViewChatMessage(message);
        viewChatMessage.getVerboseName = this.getVerboseName;
        return viewChatMessage;
    }
}
