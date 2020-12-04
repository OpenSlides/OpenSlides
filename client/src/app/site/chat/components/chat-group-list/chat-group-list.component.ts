import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

import { OperatorService, Permission } from 'app/core/core-services/operator.service';
import { ChatGroupRepositoryService } from 'app/core/repositories/chat/chat-group-repository.service';
import { GroupRepositoryService } from 'app/core/repositories/users/group-repository.service';
import { ChatNotificationService, NotificationAmount } from 'app/core/ui-services/chat-notification.service';
import { ChatGroup } from 'app/shared/models/chat/chat-group';
import { BaseViewComponentDirective } from 'app/site/base/base-view';
import { ViewGroup } from 'app/site/users/models/view-group';
import { ViewChatGroup } from '../../models/view-chat-group';

@Component({
    selector: 'os-chat-group-list',
    templateUrl: './chat-group-list.component.html',
    styleUrls: ['./chat-group-list.component.scss']
})
export class ChatGroupListComponent extends BaseViewComponentDirective implements OnInit {
    @ViewChild('createUpdateDialog', { static: true })
    private createUpdateDialog: TemplateRef<string>;

    public createUpdateForm: FormGroup;
    public groupsBehaviorSubject: BehaviorSubject<ViewGroup[]>;

    private isEdit = false;
    public editModel: ViewChatGroup | null = null;

    public get isCreateMode(): boolean {
        return this.isEdit && this.editModel === null;
    }

    public get isEditMode(): boolean {
        return this.isEdit && this.editModel !== null;
    }

    public chatGroups: ViewChatGroup[] = [];

    public get canEdit(): boolean {
        return this.operator.hasPerms(Permission.chatCanManage);
    }

    public notificationAmounts: NotificationAmount = {};

    public constructor(
        titleService: Title,
        protected translate: TranslateService,
        matSnackBar: MatSnackBar,
        private repo: ChatGroupRepositoryService,
        private formBuilder: FormBuilder,
        private groupRepo: GroupRepositoryService,
        private dialog: MatDialog,
        private operator: OperatorService,
        private chatNotificationService: ChatNotificationService
    ) {
        super(titleService, translate, matSnackBar);
        this.groupsBehaviorSubject = this.groupRepo.getViewModelListBehaviorSubject();

        this.repo.getViewModelListBehaviorSubject().subscribe(list => (this.chatGroups = list));
        this.chatNotificationService.chatgroupNotificationsObservable.subscribe(n => (this.notificationAmounts = n));

        this.createUpdateForm = this.formBuilder.group({
            name: ['', Validators.required],
            access_groups_id: [[]]
        });
    }

    public ngOnInit(): void {
        super.setTitle('Chat groups');
    }

    public createNewChatGroup(): void {
        if (this.isEdit) {
            return;
        }

        this.isEdit = true;
        this.editModel = null;
        this.createUpdateForm.reset();
        this.openDialog();
    }

    public edit(chatGroup: ViewChatGroup): void {
        if (this.isEdit) {
            return;
        }

        this.isEdit = true;
        this.editModel = chatGroup;
        this.createUpdateForm.patchValue({ name: chatGroup.name, access_groups_id: chatGroup.access_groups_id });
        this.openDialog();
    }

    private openDialog(): void {
        const dialogRef = this.dialog.open(this.createUpdateDialog);
        dialogRef.afterClosed().subscribe(res => {
            if (res) {
                this.save();
            }
            this.isEdit = false;
        });
    }

    public save(): void {
        if (this.isCreateMode) {
            this.repo.create(this.createUpdateForm.value as ChatGroup).catch(this.raiseError);
        } else if (this.isEditMode) {
            this.repo.update(this.createUpdateForm.value as ChatGroup, this.editModel).catch(this.raiseError);
        }
    }

    public amountNotification(chatGroup: ViewChatGroup): number {
        return this.notificationAmounts[chatGroup.id];
    }
}
