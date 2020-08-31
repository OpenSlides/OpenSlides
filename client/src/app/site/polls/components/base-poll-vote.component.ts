import { Directive, Input } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { OperatorService } from 'app/core/core-services/operator.service';
import { VotingError } from 'app/core/ui-services/voting.service';
import { BaseViewComponentDirective } from 'app/site/base/base-view';
import { ViewUser } from 'app/site/users/models/view-user';
import { ViewBasePoll } from '../models/view-base-poll';

@Directive()
export abstract class BasePollVoteComponentDirective<V extends ViewBasePoll> extends BaseViewComponentDirective {
    @Input()
    public poll: V;

    public votingErrors = VotingError;

    public deliveringVote = false;

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
