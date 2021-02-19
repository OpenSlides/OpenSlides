import { CdkVirtualScrollViewport, ExtendedScrollToOptions } from '@angular/cdk/scrolling';
import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Input,
    OnDestroy,
    OnInit,
    ViewChild
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { ChatGroupRepositoryService } from 'app/core/repositories/chat/chat-group-repository.service';
import { ChatMessageRepositoryService } from 'app/core/repositories/chat/chat-message-repository.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { ChatGroup } from 'app/shared/models/chat/chat-group';
import { infoDialogSettings } from 'app/shared/utils/dialog-settings';
import { BaseViewComponentDirective } from 'app/site/base/base-view';
import { ChatNotificationService } from 'app/site/chat/services/chat-notification.service';
import { ViewGroup } from 'app/site/users/models/view-group';
import {
    ChatGroupData,
    EditChatGroupDialogComponent
} from '../edit-chat-group-dialog/edit-chat-group-dialog.component';
import { ViewChatGroup } from '../../models/view-chat-group';
import { ViewChatMessage } from '../../models/view-chat-message';

@Component({
    selector: 'os-chat-group-detail',
    templateUrl: './chat-group-detail.component.html',
    styleUrls: ['./chat-group-detail.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatGroupDetailComponent extends BaseViewComponentDirective implements OnInit, AfterViewInit, OnDestroy {
    @Input()
    public chatGroup: ViewChatGroup;

    @ViewChild(CdkVirtualScrollViewport)
    public virtualScrollViewport?: CdkVirtualScrollViewport;

    public chatGroupId: number;

    public chatMessages: ViewChatMessage[] = [];

    public get isOnBottomOfChat(): boolean {
        const isOnBottom = this.virtualScrollViewport?.measureScrollOffset('bottom') === 0;
        return isOnBottom;
    }

    public get readOnlyGroups(): ViewGroup[] {
        const readGroups = this.chatGroup?.read_groups;
        const writeGrous = this.chatGroup?.write_groups;
        return readGroups?.filter(group => !writeGrous.includes(group)) || [];
    }

    public constructor(
        titleService: Title,
        protected translate: TranslateService,
        matSnackBar: MatSnackBar,
        private repo: ChatGroupRepositoryService,
        private chatMessageRepo: ChatMessageRepositoryService,
        private chatNotificationService: ChatNotificationService,
        private dialog: MatDialog,
        private promptService: PromptService,
        private cd: ChangeDetectorRef
    ) {
        super(titleService, translate, matSnackBar);
    }

    public ngOnInit(): void {
        this.chatGroupId = this.chatGroup.id;
        this.chatNotificationService.openChat(this.chatGroupId);
        this.subscriptions.push(
            this.chatMessageRepo.getViewModelListBehaviorSubject().subscribe(chatMessages => {
                this.chatMessages = chatMessages.filter(message => {
                    return message.chatgroup_id === this.chatGroup.id;
                });

                if (this.isOnBottomOfChat) {
                    this.scrollToBottom();
                }
                this.cd.markForCheck();
            })
        );
    }

    public ngAfterViewInit(): void {
        this.scrollToBottom();
    }

    public ngOnDestroy(): void {
        this.chatNotificationService.closeChat(this.chatGroupId);
    }

    private scrollToBottom(): void {
        /**
         * I am aware that this is ugly, but that is the only way to get to
         * the bottom reliably
         * https://stackoverflow.com/questions/64932671/scroll-to-bottom-with-cdk-virtual-scroll-angular-8/65069130
         */
        const scrollTarget: ExtendedScrollToOptions = {
            bottom: 0,
            behavior: 'auto'
        };
        setTimeout(() => {
            this.virtualScrollViewport.scrollTo(scrollTarget);
        }, 0);
        setTimeout(() => {
            this.virtualScrollViewport.scrollTo(scrollTarget);
        }, 100);
    }

    public editChat(): void {
        const chatData: ChatGroupData = {
            name: this.chatGroup.name,
            read_groups_id: this.chatGroup.read_groups_id,
            write_groups_id: this.chatGroup.write_groups_id
        };

        const dialogRef = this.dialog.open(EditChatGroupDialogComponent, {
            data: chatData,
            ...infoDialogSettings
        });

        dialogRef.afterClosed().subscribe((res: ChatGroupData) => {
            if (res) {
                this.save(res);
            }
        });
    }

    public async save(chatData: ChatGroupData): Promise<void> {
        await this.repo.update(chatData as ChatGroup, this.chatGroup).catch(this.raiseError);
        this.cd.markForCheck();
    }

    public async clearChat(): Promise<void> {
        const title = this.translate.instant('Are you sure you want to clear all messages in this chat?');
        if (await this.promptService.open(title)) {
            await this.repo.clearMessages(this.chatGroup).catch(this.raiseError);
            this.cd.markForCheck();
        }
    }

    public async deleteChatGroup(): Promise<void> {
        const title = this.translate.instant('Are you sure you want to delete this chat group?');
        const content = this.chatGroup.name;
        if (await this.promptService.open(title, content)) {
            await this.repo.delete(this.chatGroup).catch(this.raiseError);
            this.cd.markForCheck();
        }
    }

    public async deleteChatMessage(message: ViewChatMessage): Promise<void> {
        const title = this.translate.instant('Are you sure you want to delete this message?');
        if (await this.promptService.open(title)) {
            await this.chatMessageRepo.delete(message).catch(this.raiseError);
            this.cd.markForCheck();
        }
    }
}
