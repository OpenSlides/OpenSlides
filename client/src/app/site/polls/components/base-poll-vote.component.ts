import { Input } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { OperatorService } from 'app/core/core-services/operator.service';
import { VotingError } from 'app/core/ui-services/voting.service';
import { BaseViewComponent } from 'app/site/base/base-view';
import { ViewUser } from 'app/site/users/models/view-user';
import { ViewBasePoll } from '../models/view-base-poll';

export abstract class BasePollVoteComponent<V extends ViewBasePoll> extends BaseViewComponent {
    @Input()
    public poll: V;

    public votingErrors = VotingError;

    protected user: ViewUser;

    public constructor(
        title: Title,
        translate: TranslateService,
        matSnackbar: MatSnackBar,
        protected operator: OperatorService
    ) {
        super(title, translate, matSnackbar);

        this.subscriptions.push(
            this.operator.getViewUserObservable().subscribe(user => {
                this.user = user;
            })
        );
    }
}
