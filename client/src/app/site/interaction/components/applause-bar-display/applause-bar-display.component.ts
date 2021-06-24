import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { ConfigService } from 'app/core/ui-services/config.service';
import { fadeAnimation } from 'app/shared/animations';
import { BaseViewComponentDirective } from 'app/site/base/base-view';
import { ApplauseService, ApplauseType } from 'app/site/interaction/services/applause.service';

@Component({
    selector: 'os-applause-bar-display',
    templateUrl: './applause-bar-display.component.html',
    styleUrls: ['./applause-bar-display.component.scss'],
    animations: [fadeAnimation],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class ApplauseBarDisplayComponent extends BaseViewComponentDirective {
    public level = 0;
    public showLevel: boolean;
    public percent = 0;

    public get hasLevel(): boolean {
        return !!this.level;
    }

    public constructor(
        title: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        cd: ChangeDetectorRef,
        private applauseService: ApplauseService,
        configService: ConfigService
    ) {
        super(title, translate, matSnackBar);
        this.subscriptions.push(
            applauseService.applauseLevelObservable.subscribe(applauseLevel => {
                this.level = applauseLevel || 0;
                this.percent = this.applauseService.getApplauseQuote(this.level) * 100;
                cd.markForCheck();
            }),
            configService.get<ApplauseType>('general_system_applause_type').subscribe(() => {
                cd.markForCheck();
            })
        );
    }
}
