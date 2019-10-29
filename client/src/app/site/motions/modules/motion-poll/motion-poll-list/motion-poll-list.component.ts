import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';
import { PblColumnDefinition } from '@pebula/ngrid';

import { StorageService } from 'app/core/core-services/storage.service';
import { MotionPollRepositoryService } from 'app/core/repositories/motions/motion-poll-repository.service';
import { BaseListViewComponent } from 'app/site/base/base-list-view';
import { ViewMotionPoll } from 'app/site/motions/models/view-motion-poll';

@Component({
    selector: 'os-motion-poll-list',
    templateUrl: './motion-poll-list.component.html',
    styleUrls: ['./motion-poll-list.component.scss']
})
export class MotionPollListComponent extends BaseListViewComponent<ViewMotionPoll> implements OnInit {
    public tableColumnDefinition: PblColumnDefinition[] = [
        {
            prop: 'title',
            width: 'auto'
        },
        {
            prop: 'state',
            width: 'auto'
        }
    ];

    public polls: ViewMotionPoll[] = [];

    public constructor(
        title: Title,
        protected translate: TranslateService,
        matSnackbar: MatSnackBar,
        storage: StorageService,
        public repo: MotionPollRepositoryService
    ) {
        super(title, translate, matSnackbar, storage);
    }

    public ngOnInit(): void {
        this.subscriptions.push(this.repo.getViewModelListObservable().subscribe(polls => (this.polls = polls)));
    }
}
