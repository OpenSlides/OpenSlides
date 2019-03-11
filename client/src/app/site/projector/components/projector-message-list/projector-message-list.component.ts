import { Component, OnInit } from '@angular/core';
import { Title, SafeHtml, DomSanitizer } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material';
import { FormGroup, FormBuilder } from '@angular/forms';

import { TranslateService } from '@ngx-translate/core';

import { BaseViewComponent } from '../../../base/base-view';
import { ProjectorMessage } from 'app/shared/models/core/projector-message';
import { ViewProjectorMessage } from '../../models/view-projector-message';
import { ProjectorMessageRepositoryService } from 'app/core/repositories/projector/projector-message-repository.service';
import { PromptService } from 'app/core/ui-services/prompt.service';

/**
 * List view for the projector messages.
 */
@Component({
    selector: 'os-projector-message-list',
    templateUrl: './projector-message-list.component.html',
    styleUrls: ['./projector-message-list.component.scss']
})
export class ProjectorMessageListComponent extends BaseViewComponent implements OnInit {
    public messageToCreate: ProjectorMessage | null;

    /**
     * Source of the Data
     */
    public messages: ViewProjectorMessage[] = [];

    /**
     * The current focussed formgroup
     */
    public updateForm: FormGroup;

    public createForm: FormGroup;

    public openId: number | null;
    public editId: number | null;

    /**
     */
    public constructor(
        titleService: Title,
        protected translate: TranslateService, // protected required for ng-translate-extract
        matSnackBar: MatSnackBar,
        private repo: ProjectorMessageRepositoryService,
        private formBuilder: FormBuilder,
        private promptService: PromptService,
        private santinizer: DomSanitizer
    ) {
        super(titleService, translate, matSnackBar);

        const form = {
            message: ['']
        };
        this.createForm = this.formBuilder.group(form);
        this.updateForm = this.formBuilder.group(form);
    }

    /**
     * Init function.
     *
     * Sets the title and gets/observes messages from DataStore
     */
    public ngOnInit(): void {
        super.setTitle('Messages');
        this.messages = this.repo.getViewModelList();
        this.repo.getViewModelListObservable().subscribe(messages => (this.messages = messages));
    }

    public getSafeMessage(message: ViewProjectorMessage): SafeHtml {
        return this.santinizer.bypassSecurityTrustHtml(message.message);
    }

    /**
     * Add a new message.
     */
    public onPlusButton(): void {
        if (!this.messageToCreate) {
            this.createForm.reset();
            this.createForm.setValue({
                message: ''
            });
            this.messageToCreate = new ProjectorMessage();
        }
    }

    /**
     * Handler when clicking on create to create a new statute paragraph
     */
    public create(): void {
        if (this.createForm.valid) {
            this.messageToCreate.patchValues(this.createForm.value as ProjectorMessage);
            this.repo.create(this.messageToCreate).then(() => {
                this.messageToCreate = null;
            }, this.raiseError);
        }
    }

    /**
     * Executed on edit button
     * @param message
     */
    public onEditButton(message: ViewProjectorMessage): void {
        this.editId = message.id;

        this.updateForm.setValue({
            message: message.message
        });
    }

    /**
     * Saves the message
     * @param message The message to save
     */
    public onSaveButton(message: ViewProjectorMessage): void {
        if (this.updateForm.valid) {
            this.repo.update(this.updateForm.value as Partial<ProjectorMessage>, message).then(() => {
                this.openId = this.editId = null;
            }, this.raiseError);
        }
    }

    /**
     * Is executed, when the delete button is pressed
     *
     * @param message The message to delete
     */
    public async onDeleteButton(message: ViewProjectorMessage): Promise<void> {
        const title = this.translate.instant('Are you sure you want to delete the selected message?');
        if (await this.promptService.open(title, null)) {
            this.repo.delete(message).then(() => (this.openId = this.editId = null), this.raiseError);
        }
    }

    /**
     * Is executed when a mat-extension-panel is closed
     *
     * @param message the message in the panel
     */
    public panelClosed(message: ViewProjectorMessage): void {
        this.openId = null;
        if (this.editId) {
            this.onSaveButton(message);
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
        this.messageToCreate = null;
    }

    /**
     * clicking Shift and Enter will save automatically
     * clicking Escape will cancel the process
     *
     * @param event has the code
     */
    public onKeyDownUpdate(event: KeyboardEvent): void {
        if (event.key === 'Enter' && event.shiftKey) {
            const message = this.messages.find(x => x.id === this.editId);
            this.onSaveButton(message);
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
