import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';

import { TranslateService } from '@ngx-translate/core';

import { BaseViewComponent } from 'app/site/base/base-view';
import { ViewCountdown } from '../../models/view-countdown';
import { CountdownRepositoryService } from 'app/core/repositories/projector/countdown-repository.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { Projector } from 'app/shared/models/core/projector';
import { ProjectionDialogService } from 'app/core/ui-services/projection-dialog.service';

/**
 *
 */
@Component({
    selector: 'os-countdown-controls',
    templateUrl: './countdown-controls.component.html',
    styleUrls: ['./countdown-controls.component.scss']
})
export class CountdownControlsComponent extends BaseViewComponent {
    /**
     * Countdown as input
     */
    @Input()
    public countdown: ViewCountdown;

    /**
     * Edit event
     */
    @Output()
    public editEvent = new EventEmitter<ViewCountdown>();

    /**
     * Pre defined projection target (if any)
     */
    @Input()
    public projector: Projector;

    /**
     * The time in seconds to make the countdown orange, is the countdown is below this value.
     */
    public warningTime: number;

    /**
     * Constructor
     *
     * @param titleService
     * @param translate
     * @param matSnackBar
     * @param repo
     * @param configService
     * @param promptService
     */
    public constructor(
        titleService: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        private repo: CountdownRepositoryService,
        private configService: ConfigService,
        private promptService: PromptService,
        private projectionDialogService: ProjectionDialogService
    ) {
        super(titleService, translate, matSnackBar);

        this.configService.get<number>('agenda_countdown_warning_time').subscribe(time => (this.warningTime = time));
    }

    /**
     * Start the countdown
     */
    public start(event: Event): void {
        event.stopPropagation();
        this.repo.start(this.countdown).catch(this.raiseError);
    }

    /**
     * Pause the countdown
     */
    public pause(event: Event): void {
        event.stopPropagation();
        this.repo.pause(this.countdown).catch(this.raiseError);
    }

    /**
     * Stop the countdown
     */
    public stop(event: Event): void {
        event.stopPropagation();
        this.repo.stop(this.countdown).catch(this.raiseError);
    }

    /**
     * One can stop the countdown, if it is running or not resetted.
     */
    public canStop(): boolean {
        return this.countdown.running || this.countdown.countdown_time !== this.countdown.default_time;
    }

    /**
     * Fires an edit event
     */
    public onEdit(): void {
        this.editEvent.next(this.countdown);
    }

    /**
     * Brings the projection dialog
     */
    public onBringDialog(): void {
        this.projectionDialogService.openProjectDialogFor(this.countdown);
    }

    /**
     * On delete button
     */
    public async onDelete(): Promise<void> {
        const content =
            this.translate.instant('Delete countdown') + ` ${this.translate.instant(this.countdown.title)}?`;
        if (await this.promptService.open('Are you sure?', content)) {
            this.repo.delete(this.countdown).then(() => {}, this.raiseError);
        }
    }
}
