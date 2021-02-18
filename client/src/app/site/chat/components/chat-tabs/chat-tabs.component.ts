import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { OperatorService } from 'app/core/core-services/operator.service';
import { ChatGroupRepositoryService } from 'app/core/repositories/chat/chat-group-repository.service';
import { ChatMessageRepositoryService } from 'app/core/repositories/chat/chat-message-repository.service';
import { collapseAndFade } from 'app/shared/animations';
import { ChatMessage } from 'app/shared/models/chat/chat-message';
import { BaseViewComponentDirective } from 'app/site/base/base-view';
import { ChatNotificationService, NotificationAmount } from '../../services/chat-notification.service';
import { ViewChatGroup } from '../../models/view-chat-group';

@Component({
    selector: 'os-chat-tabs',
    templateUrl: './chat-tabs.component.html',
    styleUrls: ['./chat-tabs.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: [collapseAndFade]
})
export class ChatTabsComponent extends BaseViewComponentDirective implements OnInit {
    public chatGroupSubject: BehaviorSubject<ViewChatGroup[]>;
    public newMessageForm: FormGroup;
    private selectedTabIndex = 0;

    private notifications: NotificationAmount;

    private get chatGroupFromIndex(): ViewChatGroup {
        return this.chatGroupSubject.value[this.selectedTabIndex];
    }

    public get chatGroupsExist(): boolean {
        return this.chatGroupSubject.value.length > 0;
    }

    public get canSendInSelectedChat(): boolean {
        if (!this.chatGroupFromIndex) {
            return false;
        }
        return this.operator.isInGroupIds(...this.chatGroupFromIndex?.write_groups_id) || false;
    }

    public constructor(
        titleService: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        private repo: ChatGroupRepositoryService,
        private chatMessageRepo: ChatMessageRepositoryService,
        private chatNotificationService: ChatNotificationService,
        private operator: OperatorService,
        formBuilder: FormBuilder
    ) {
        super(titleService, translate, matSnackBar);

        this.newMessageForm = formBuilder.group({
            text: ['']
        });
    }

    public ngOnInit(): void {
        this.chatGroupSubject = this.repo.getViewModelListBehaviorSubject();

        this.chatNotificationService.chatgroupNotificationsObservable.subscribe(notifications => {
            this.notifications = notifications;
        });
    }

    public selectedTabChange(event: MatTabChangeEvent): void {
        this.selectedTabIndex = event.index;
    }

    public getNotificationsForChatId(chatId: number): number {
        return this.notifications?.[chatId] ?? 0;
    }

    public isChatMessageEmpty(): boolean {
        return !this.newMessageForm?.value?.text?.trim();
    }

    public send(): void {
        const payload = {
            text: this.newMessageForm.value.text,
            chatgroup_id: this.chatGroupFromIndex.id
        };
        this.chatMessageRepo
            .create(payload as ChatMessage)
            .then(() => {
                this.clearTextInput();
            })
            .catch(this.raiseError);
    }

    private clearTextInput(): void {
        this.newMessageForm.reset();
    }
}
