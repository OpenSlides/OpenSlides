import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

import { GroupRepositoryService } from 'app/core/repositories/users/group-repository.service';
import { ViewGroup } from 'app/site/users/models/view-group';

export interface ChatGroupData {
    name: string;
    read_groups_id: number[];
    write_groups_id: number[];
}

@Component({
    selector: 'os-edit-chat-group-dialog',
    templateUrl: './edit-chat-group-dialog.component.html',
    styleUrls: ['./edit-chat-group-dialog.component.scss']
})
export class EditChatGroupDialogComponent {
    public createUpdateForm: FormGroup;
    public groupsBehaviorSubject: BehaviorSubject<ViewGroup[]>;

    public createMode: boolean;

    public get previousChatGroupName(): string {
        return this.data?.name || '';
    }

    public constructor(
        groupRepo: GroupRepositoryService,
        formBuilder: FormBuilder,
        @Inject(MAT_DIALOG_DATA) public data?: ChatGroupData
    ) {
        this.createMode = !data;
        this.createUpdateForm = formBuilder.group({
            name: [data?.name || '', Validators.required],
            read_groups_id: [data?.read_groups_id || []],
            write_groups_id: [data?.write_groups_id || []]
        });
        this.groupsBehaviorSubject = groupRepo.getViewModelListBehaviorSubject();
    }
}
