import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';
import { PblColumnDefinition } from '@pebula/ngrid';

import { StorageService } from 'app/core/core-services/storage.service';
import { VotingService } from 'app/core/ui-services/voting.service';
import { BaseListViewComponent } from 'app/site/base/base-list-view';
import { PollFilterListService } from '../../services/poll-filter-list.service';
import { PollListObservableService } from '../../services/poll-list-observable.service';
import { ViewBasePoll } from '../../models/view-base-poll';

@Component({
    selector: 'os-poll-list',
    templateUrl: './poll-list.component.html',
    styleUrls: ['./poll-list.component.scss']
})
export class PollListComponent extends BaseListViewComponent<ViewBasePoll> {
    public tableColumnDefinition: PblColumnDefinition[] = [
        {
            prop: 'title',
            width: 'auto'
        },
        {
            prop: 'classType',
            width: 'auto'
        },
        {
            prop: 'state',
            width: 'auto'
        },
        {
            prop: 'votability',
            width: '25px'
        }
    ];
    public filterProps = ['title', 'state'];

    public constructor(
        public polls: PollListObservableService,
        public filterService: PollFilterListService,
        public votingService: VotingService,
        protected storage: StorageService,
        title: Title,
        translate: TranslateService,
        snackbar: MatSnackBar
    ) {
        super(title, translate, snackbar, storage);
        super.setTitle('List of electronic votes');
    }
}
