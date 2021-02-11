import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { ChatGroupDetailComponent } from './components/chat-group-detail/chat-group-detail.component';
import { ChatGroupListComponent } from './components/chat-group-list/chat-group-list.component';
import { ChatMessageComponent } from './components/chat-message/chat-message.component';
import { ChatRoutingModule } from './chat-routing.module';
import { ChatTabsComponent } from './components/chat-tabs/chat-tabs.component';
import { EditChatGroupDialogComponent } from './components/edit-chat-group-dialog/edit-chat-group-dialog.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
    imports: [CommonModule, ChatRoutingModule, SharedModule],
    declarations: [
        ChatGroupListComponent,
        ChatGroupDetailComponent,
        ChatTabsComponent,
        EditChatGroupDialogComponent,
        ChatMessageComponent
    ]
})
export class ChatModule {}
