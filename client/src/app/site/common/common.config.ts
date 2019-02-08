import { AppConfig } from '../../core/app-config';
import { ChatMessage } from '../../shared/models/core/chat-message';
import { ChatMessageRepositoryService } from 'app/core/repositories/common/chatmessage-repository.service';
import { ViewChatMessage } from './models/view-chatmessage';

export const CommonAppConfig: AppConfig = {
    name: 'common',
    models: [
        {
            collectionString: 'core/chat-message',
            model: ChatMessage,
            viewModel: ViewChatMessage,
            repository: ChatMessageRepositoryService
        }
    ],
    mainMenuEntries: [
        {
            route: '/',
            displayName: 'Home',
            icon: 'home',
            weight: 100,
            permission: 'core.can_see_frontpage'
        }
    ]
};
