import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { ProjectorMessageRepositoryService } from 'app/core/repositories/projector/projector-message-repository.service';
import { ProjectionDialogService } from 'app/core/ui-services/projection-dialog.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { Projector } from 'app/shared/models/core/projector';
import { BaseViewComponentDirective } from 'app/site/base/base-view';
import { ViewProjectorMessage } from '../../models/view-projector-message';

/**
 * Small controls component for messages.
 * Used in the projector detail view, can could be embedded anywhere else
 */
@Component({
    selector: 'os-message-controls',
    templateUrl: './message-controls.component.html',
    styleUrls: ['./message-controls.component.scss']
})
export class MessageControlsComponent extends BaseViewComponentDirective implements OnInit {
    /**
     * Input slot for the projector message model
     */
    @Input()
    public message: ViewProjectorMessage;

    /**
     * Output event for the edit button
     */
    @Output()
    public editEvent = new EventEmitter<ViewProjectorMessage>();

    /**
     * Pre defined projection target (if any)
     */
    @Input()
    public projector: Projector;

    /**
     * Constructor
     *
     * @param titleService set the title, required by parent
     * @param matSnackBar show errors
     * @param translate translate properties
     * @param repo the projector message repo
     * @param promptService delete prompt
     */
    public constructor(
        titleService: Title,
        matSnackBar: MatSnackBar,
        protected translate: TranslateService,
        private repo: ProjectorMessageRepositoryService,
        private promptService: PromptService,
        private projectionDialogService: ProjectionDialogService
    ) {
        super(titleService, translate, matSnackBar);
    }

    /**
     * Init
     */
    public ngOnInit(): void {}

    /**
     * Fires an edit event
     */
    public onEdit(): void {
        this.editEvent.next(this.message);
    }

    /**
     * Brings the projection dialog
     */
    public onBringDialog(): void {
        this.projectionDialogService.openProjectDialogFor(this.message);
    }

    /**
     * On delete button
     */
    public async onDelete(): Promise<void> {
        const content =
            this.translate.instant('Delete message') + ` ${this.translate.instant(this.message.getTitle())}?`;
        if (await this.promptService.open('Are you sure?', content)) {
            this.repo.delete(this.message).then(() => {}, this.raiseError);
        }
    }
}
