import { Component, OnInit, TemplateRef } from '@angular/core';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';
import { PblColumnDefinition } from '@pebula/ngrid';

import { BaseListViewComponent } from 'app/site/base/base-list-view';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { ViewWorkflow } from 'app/site/motions/models/view-workflow';
import { WorkflowRepositoryService } from 'app/core/repositories/motions/workflow-repository.service';
import { Workflow } from 'app/shared/models/motions/workflow';
import { StorageService } from 'app/core/core-services/storage.service';

/**
 * List view for workflows
 */
@Component({
    selector: 'os-workflow-list',
    templateUrl: './workflow-list.component.html',
    styleUrls: ['./workflow-list.component.scss']
})
export class WorkflowListComponent extends BaseListViewComponent<ViewWorkflow> implements OnInit {
    /**
     * Holds the new workflow title
     */
    public newWorkflowTitle: string;

    /**
     * Define the columns to show
     */
    public tableColumnDefinition: PblColumnDefinition[] = [
        {
            prop: 'name',
            width: 'auto'
        },
        {
            prop: 'delete'
        }
    ];

    /**
     * Constructor
     *
     * @param titleService Sets the title
     * @param matSnackBar Showing errors
     * @param translate handle trandlations
     * @param dialog Dialog options
     * @param workflowRepo Repository for Workflows
     * @param promptService Before delete, ask
     */
    public constructor(
        titleService: Title,
        protected translate: TranslateService,
        matSnackBar: MatSnackBar,
        storage: StorageService,
        private dialog: MatDialog,
        public workflowRepo: WorkflowRepositoryService,
        private promptService: PromptService
    ) {
        super(titleService, translate, matSnackBar, storage);
    }

    /**
     * Init. Observe the repository
     */
    public ngOnInit(): void {
        super.setTitle('Workflows');
    }

    /**
     * Main Event handler. Create new Workflow
     *
     * @param templateRef The reference to the dialog
     */
    public onNewButton(templateRef: TemplateRef<string>): void {
        this.newWorkflowTitle = '';
        const dialogRef = this.dialog.open(templateRef, {
            width: '400px'
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.workflowRepo.create(new Workflow({ name: result })).then(() => {}, this.raiseError);
            }
        });
    }

    /**
     * Click delete button for workflow
     *
     * @param selected the selected workflow
     */
    public async onDeleteWorkflow(selected: ViewWorkflow): Promise<void> {
        const title = this.translate.instant('Are you sure you want to delete this workflow?');
        const content = selected.getTitle();
        if (await this.promptService.open(title, content)) {
            this.workflowRepo.delete(selected).then(() => {}, this.raiseError);
        }
    }
}
