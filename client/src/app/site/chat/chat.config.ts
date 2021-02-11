import { AppConfig } from '../../core/definitions/app-config';
import { ChatGroupRepositoryService } from 'app/core/repositories/chat/chat-group-repository.service';
import { ChatMessageRepositoryService } from 'app/core/repositories/chat/chat-message-repository.service';
import { ChatGroup } from 'app/shared/models/chat/chat-group';
import { ChatMessage } from 'app/shared/models/chat/chat-message';
import { ViewChatGroup } from './models/view-chat-group';
import { ViewChatMessage } from './models/view-chat-message';

export const ChatAppConfig: AppConfig = {
    name: 'chat',
    models: [
        {
            model: ChatGroup,
            viewModel: ViewChatGroup,
            repository: ChatGroupRepositoryService
        },
        {
            model: ChatMessage,
            viewModel: ViewChatMessage,
            repository: ChatMessageRepositoryService
        }
    ]
};
