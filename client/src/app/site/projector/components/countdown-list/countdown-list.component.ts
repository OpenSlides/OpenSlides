import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

import { TranslateService } from '@ngx-translate/core';

import { PromptService } from 'app/core/ui-services/prompt.service';
import { BaseViewComponent } from '../../../base/base-view';
import { ViewCountdown } from '../../models/view-countdown';
import { CountdownRepositoryService } from 'app/core/repositories/projector/countdown-repository.service';
import { Countdown } from 'app/shared/models/core/countdown';
import { DurationService } from 'app/core/ui-services/duration.service';

/**
 * List view for countdowns.
 */
@Component({
    selector: 'os-countdown-list',
    templateUrl: './countdown-list.component.html',
    styleUrls: ['./countdown-list.component.scss']
})
export class CountdownListComponent extends BaseViewComponent implements OnInit {
    public countdownToCreate: Countdown | null;

    /**
     * Source of the Data
     */
    public countdowns: ViewCountdown[] = [];

    /**
     * The current focussed formgroup
     */
    public updateForm: FormGroup;

    public createForm: FormGroup;

    public openId: number | null;
    public editId: number | null;

    public constructor(
        titleService: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        private repo: CountdownRepositoryService,
        private formBuilder: FormBuilder,
        private promptService: PromptService,
        private durationService: DurationService
    ) {
        super(titleService, translate, matSnackBar);

        const form = {
            description: ['', Validators.required],
            default_time: ['', Validators.required]
        };
        this.createForm = this.formBuilder.group(form);
        this.updateForm = this.formBuilder.group(form);
    }

    /**
     * Init function.
     *
     * Sets the title and gets/observes countdowns from DataStore
     */
    public ngOnInit(): void {
        super.setTitle('Countdowns');
        this.repo.getViewModelListObservable().subscribe(newCountdowns => {
            this.countdowns = newCountdowns;
        });
    }

    /**
     * Add a new countdown.
     */
    public onPlusButton(): void {
        if (!this.countdownToCreate) {
            this.createForm.reset();
            this.createForm.setValue({
                description: '',
                default_time: '1:00 m'
            });
            this.countdownToCreate = new Countdown();
        }
    }

    /**
     * Handler when clicking on create to create a new statute paragraph
     */
    public create(): void {
        if (this.createForm.valid) {
            let default_time = this.durationService.stringToDuration(this.createForm.value.default_time, 'm');
            if (default_time === 0) {
                default_time = 60;
            }

            const newValues: Partial<Countdown> = {
                description: this.createForm.value.description,
                default_time: default_time
            };
            newValues.countdown_time = default_time;
            this.countdownToCreate.patchValues(newValues);
            this.repo.create(this.countdownToCreate).then(() => {
                this.countdownToCreate = null;
            }, this.raiseError);
        }
    }

    /**
     * Executed on edit button
     * @param countdown
     */
    public onEditButton(countdown: ViewCountdown): void {
        this.editId = countdown.id;

        this.updateForm.setValue({
            description: countdown.description,
            default_time: this.durationService.durationToString(countdown.default_time, 'm')
        });
    }

    /**
     * Saves the countdown
     * @param countdown The countdown to save
     */
    public onSaveButton(countdown: ViewCountdown): void {
        if (this.updateForm.valid) {
            let default_time = this.durationService.stringToDuration(this.updateForm.value.default_time, 'm');
            if (default_time === 0) {
                default_time = 60;
            }
            const newValues: Partial<Countdown> = {
                description: this.updateForm.value.description,
                default_time: default_time
            };
            if (!countdown.running) {
                newValues.countdown_time = default_time;
            }
            this.repo.update(newValues, countdown).then(() => {
                this.openId = this.editId = null;
            }, this.raiseError);
        }
    }

    /**
     * Is executed, when the delete button is pressed
     *
     * @param countdown The countdown to delete
     */
    public async onDeleteButton(countdown: ViewCountdown): Promise<void> {
        const content = this.translate.instant('Delete countdown') + ` ${countdown.description}?`;
        if (await this.promptService.open('Are you sure?', content)) {
            this.repo.delete(countdown).then(() => (this.openId = this.editId = null), this.raiseError);
        }
    }

    /**
     * Is executed when a mat-extension-panel is closed
     *
     * @param countdown the statute paragraph in the panel
     */
    public panelClosed(countdown: ViewCountdown): void {
        this.openId = null;
        if (this.editId) {
            this.onSaveButton(countdown);
        }
    }

    /**
     * clicking Shift and Enter will save automatically
     * clicking Escape will cancel the process
     *
     * @param event has the code
     */
    public onKeyDownCreate(event: KeyboardEvent): void {
        if (event.key === 'Enter' && event.shiftKey) {
            this.create();
        }
        if (event.key === 'Escape') {
            this.onCancelCreate();
        }
    }

    /**
     * Cancels the current form action
     */
    public onCancelCreate(): void {
        this.countdownToCreate = null;
    }

    /**
     * clicking Shift and Enter will save automatically
     * clicking Escape will cancel the process
     *
     * @param event has the code
     */
    public onKeyDownUpdate(event: KeyboardEvent): void {
        if (event.key === 'Enter' && event.shiftKey) {
            const countdown = this.countdowns.find(x => x.id === this.editId);
            this.onSaveButton(countdown);
        }
        if (event.key === 'Escape') {
            this.onCancelUpdate();
        }
    }

    /**
     * Cancels the current form action
     */
    public onCancelUpdate(): void {
        this.editId = null;
    }
}
