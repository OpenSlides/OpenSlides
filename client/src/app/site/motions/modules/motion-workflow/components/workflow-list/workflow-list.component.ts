import { Component, OnInit, TemplateRef } from '@angular/core';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { ListViewBaseComponent } from 'app/site/base/list-view-base';
import { MatSnackBar, MatDialog } from '@angular/material';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ViewWorkflow } from 'app/site/motions/models/view-workflow';
import { WorkflowRepositoryService } from 'app/core/repositories/motions/workflow-repository.service';
import { Workflow } from 'app/shared/models/motions/workflow';

/**
 * List view for workflows
 */
@Component({
    selector: 'os-workflow-list',
    templateUrl: './workflow-list.component.html',
    styleUrls: ['./workflow-list.component.scss']
})
export class WorkflowListComponent extends ListViewBaseComponent<ViewWorkflow, Workflow> implements OnInit {
    /**
     * Holds the new workflow title
     */
    public newWorkflowTitle: string;

    /**
     * Determine the coloms in the table
     */
    private columns: string[] = ['name', 'delete'];

    /**
     * Constructor
     *
     * @param titleService Sets the title
     * @param matSnackBar Showing errors
     * @param translate handle trandlations
     * @param dialog Dialog options
     * @param router navigating back and forth
     * @param route Information about the current router
     * @param workflowRepo Repository for Workflows
     * @param promptService Before delete, ask
     */
    public constructor(
        titleService: Title,
        matSnackBar: MatSnackBar,
        protected translate: TranslateService,
        private dialog: MatDialog,
        private router: Router,
        private route: ActivatedRoute,
        private workflowRepo: WorkflowRepositoryService,
        private promptService: PromptService
    ) {
        super(titleService, translate, matSnackBar);
    }

    /**
     * Init. Observe the repository
     */
    public ngOnInit(): void {
        super.setTitle('Workflows');
        this.initTable();
        this.workflowRepo.getViewModelListObservable().subscribe(newWorkflows => (this.dataSource.data = newWorkflows));
    }

    /**
     * Click a workflow in the table
     *
     * @param selected the selected workflow
     */
    public onClickWorkflow(selected: ViewWorkflow): void {
        this.router.navigate([`${selected.id}`], { relativeTo: this.route });
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
        const content = this.translate.instant('Delete') + ` ${selected}?`;
        if (await this.promptService.open('Are you sure?', content)) {
            this.workflowRepo.delete(selected).then(() => {}, this.raiseError);
        }
    }

    /**
     * Get the column definition for the current workflow table
     *
     * @returns The column definition for the table
     */
    public getColumnDefinition(): string[] {
        return this.columns;
    }
}
