import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Directive,
    Input,
    OnDestroy,
    OnInit,
    ViewEncapsulation
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';
import { PblColumnDefinition } from '@pebula/ngrid';
import { Label } from 'ng2-charts';
import { BehaviorSubject, from, Observable, Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { BaseComponent } from 'app/base.component';
import { OperatorService } from 'app/core/core-services/operator.service';
import { Deferred } from 'app/core/promises/deferred';
import { BaseRepository } from 'app/core/repositories/base-repository';
import { GroupRepositoryService } from 'app/core/repositories/users/group-repository.service';
import { UserRepositoryService } from 'app/core/repositories/users/user-repository.service';
import { BasePollDialogService } from 'app/core/ui-services/base-poll-dialog.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { ChartData } from 'app/shared/components/charts/charts.component';
import { EntitledUsersEntry } from 'app/shared/models/poll/base-poll';
import { BaseVote } from 'app/shared/models/poll/base-vote';
import { BaseViewComponentDirective } from 'app/site/base/base-view';
import { ViewGroup } from 'app/site/users/models/view-group';
import { ViewUser } from 'app/site/users/models/view-user';

export interface EntitledUsersTableEntry extends EntitledUsersEntry {
    user_id: number;
    user?: ViewUser;
    voted: boolean;
    voted_verbose: string;
    vote_delegated_to_id?: number;
    vote_delegated_to?: ViewUser;
}

@Component({
    selector: 'os-entitled-users-table',
    templateUrl: './entitled-users-table.component.html',
    styleUrls: ['./entitled-users-table.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class EntitledUsersTableComponent extends BaseComponent {
    @Input()
    public entitledUsersObservable: Observable<EntitledUsersTableEntry[]>;

    @Input()
    public listStorageKey: string;

    public columnDefinitionEntitledUsersTable: PblColumnDefinition[] = [
        {
            prop: 'user_id',
            width: 'auto',
            label: 'Participant'
        },
        {
            prop: 'voted',
            width: 'auto',
            label: 'Voted'
        },
        {
            prop: 'delegation',
            width: 'auto',
            label: 'Delegated to'
        }
    ];

    public filterPropsEntitledUsersTable = ['user.getFullName', 'vote_delegated_to.getFullName', 'voted_verbose'];

    public get canSeeUsers(): boolean {
        return this.operator.hasPerms(this.permission.usersCanSeeName);
    }

    public constructor(title: Title, translate: TranslateService, private operator: OperatorService) {
        super(title, translate);
    }
}
