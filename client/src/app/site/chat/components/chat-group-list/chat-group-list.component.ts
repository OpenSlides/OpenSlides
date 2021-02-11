import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { OperatorService } from 'app/core/core-services/operator.service';
import { ChatGroupRepositoryService } from 'app/core/repositories/chat/chat-group-repository.service';
import { ChatGroup } from 'app/shared/models/chat/chat-group';
import { infoDialogSettings } from 'app/shared/utils/dialog-settings';
import { BaseViewComponentDirective } from 'app/site/base/base-view';
import { ChatNotificationService, NotificationAmount } from 'app/site/chat/services/chat-notification.service';
import {
    ChatGroupData,
    EditChatGroupDialogComponent
} from '../edit-chat-group-dialog/edit-chat-group-dialog.component';
import { ViewChatGroup } from '../../models/view-chat-group';

@Component({
    selector: 'os-chat-group-list',
    templateUrl: './chat-group-list.component.html',
    styleUrls: ['./chat-group-list.component.scss']
})
export class ChatGroupListComponent extends BaseViewComponentDirective implements OnInit {
    public get canManage(): boolean {
        return this.operator.hasPerms(this.permission.chatCanManage);
    }

    public constructor(
        titleService: Title,
        protected translate: TranslateService,
        matSnackBar: MatSnackBar,
        private repo: ChatGroupRepositoryService,
        private dialog: MatDialog,
        private operator: OperatorService
    ) {
        super(titleService, translate, matSnackBar);
    }

    public ngOnInit(): void {
        super.setTitle('Chat');
    }

    public createNewChatGroup(): void {
        const dialogRef = this.dialog.open(EditChatGroupDialogComponent, {
            data: null,
            ...infoDialogSettings
        });

        dialogRef.afterClosed().subscribe((res: ChatGroupData) => {
            if (res) {
                this.save(res);
            }
        });
    }

    public save(createData: ChatGroupData): void {
        this.repo.create(createData as ChatGroup).catch(this.raiseError);
    }
}
