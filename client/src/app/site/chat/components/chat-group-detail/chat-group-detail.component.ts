import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';

import { ChatGroupRepositoryService } from 'app/core/repositories/chat/chat-group-repository.service';
import { ChatMessageRepositoryService } from 'app/core/repositories/chat/chat-message-repository.service';
import { ChatNotificationService } from 'app/core/ui-services/chat-notification.service';
import { ChatMessage } from 'app/shared/models/chat/chat-message';
import { BaseViewComponentDirective } from 'app/site/base/base-view';
import { ViewChatGroup } from '../../models/view-chat-group';
import { ViewChatMessage } from '../../models/view-chat-message';

@Component({
    selector: 'os-chat-group-detail',
    templateUrl: './chat-group-detail.component.html',
    styleUrls: ['./chat-group-detail.component.scss']
})
export class ChatGroupDetailComponent extends BaseViewComponentDirective implements OnInit, OnDestroy {
    public newMessageForm: FormGroup;
    public chatgroup: ViewChatGroup;
    public chatgroupId: number;
    public chatMessages: ViewChatMessage[] = [];

    public constructor(
        titleService: Title,
        protected translate: TranslateService,
        matSnackBar: MatSnackBar,
        private chatGroupRepo: ChatGroupRepositoryService,
        private chatMessageRepo: ChatMessageRepositoryService,
        private route: ActivatedRoute,
        private formBuilder: FormBuilder,
        private chatNotificationService: ChatNotificationService
    ) {
        super(titleService, translate, matSnackBar);

        this.newMessageForm = this.formBuilder.group({
            text: ['', Validators.required]
        });

        this.chatgroupId = parseInt(this.route.snapshot.params.id, 10);

        this.subscriptions.push(
            this.chatGroupRepo.getViewModelObservable(this.chatgroupId).subscribe(chatGroup => {
                if (chatGroup) {
                    super.setTitle(`${this.translate.instant('Chat group')} - ${chatGroup.getTitle()}`);
                    this.chatgroup = chatGroup;
                }
            }),
            this.chatMessageRepo.getViewModelListBehaviorSubject().subscribe(chatMessages => {
                this.chatMessages = chatMessages.filter(message => message.chatgroup_id === this.chatgroup.id);
            })
        );
    }

    public ngOnInit(): void {
        super.setTitle('Chat group');
        this.chatNotificationService.openChat(this.chatgroupId);
    }

    public send(): void {
        const payload = {
            text: this.newMessageForm.value.text,
            chatgroup_id: this.chatgroup.id
        };
        this.chatMessageRepo.create(payload as ChatMessage).catch(this.raiseError);
    }

    public clearChat(): void {
        this.chatGroupRepo.clearMessages(this.chatgroup).catch(this.raiseError);
    }

    public ngOnDestroy(): void {
        this.chatNotificationService.closeChat(this.chatgroupId);
    }
}
