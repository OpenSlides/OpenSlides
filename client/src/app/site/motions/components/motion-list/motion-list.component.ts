import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';

import { MotionRepositoryService } from '../../services/motion-repository.service';
import { ViewMotion } from '../../models/view-motion';
import { WorkflowState } from '../../../../shared/models/motions/workflow-state';
import { ListViewBaseComponent } from '../../../base/list-view-base';
import { MatSnackBar } from '@angular/material';
import { ConfigService } from '../../../../core/services/config.service';
import { Category } from '../../../../shared/models/motions/category';
import { PromptService } from '../../../../core/services/prompt.service';
import { MotionCsvExportService } from '../../services/motion-csv-export.service';

/**
 * Component that displays all the motions in a Table using DataSource.
 */
@Component({
    selector: 'os-motion-list',
    templateUrl: './motion-list.component.html',
    styleUrls: ['./motion-list.component.scss']
})
export class MotionListComponent extends ListViewBaseComponent<ViewMotion> implements OnInit {
    /**
     * Use for minimal width. Please note the 'selector' row for multiSelect mode,
     * to be able to display an indicator for the state of selection
     */
    public columnsToDisplayMinWidth = ['identifier', 'title', 'state', 'speakers'];

    /**
     * Use for maximal width. Please note the 'selector' row for multiSelect mode,
     * to be able to display an indicator for the state of selection
     * TODO: Needs vp.desktop check
     */
    public columnsToDisplayFullWidth = ['identifier', 'title', 'state', 'speakers'];

    /**
     * Value of the configuration variable `motions_statutes_enabled` - are statutes enabled?
     * @TODO replace by direct access to config variable, once it's available from the templates
     */
    public statutesEnabled: boolean;

    /**
     * Constructor implements title and translation Module.
     *
     * @param titleService Title
     * @param translate Translation
     * @param matSnackBar
     * @param router Router
     * @param route Current route
     * @param configService The configuration provider
     * @param repo Motion Repository
     * @param csvExport CSV Export Service
     * @param promptService
     */
    public constructor(
        titleService: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        private router: Router,
        private route: ActivatedRoute,
        private configService: ConfigService,
        private repo: MotionRepositoryService,
        private promptService: PromptService,
        private motionCsvExport: MotionCsvExportService
    ) {
        super(titleService, translate, matSnackBar);

        // enable multiSelect for this listView
        this.canMultiSelect = true;
    }

    /**
     * Init function.
     *
     * Sets the title, inits the table and calls the repository
     */
    public ngOnInit(): void {
        super.setTitle('Motions');
        this.initTable();
        this.repo.getViewModelListObservable().subscribe(newMotions => {
            this.checkSelection();
            // TODO: This is for testing purposes. Can be removed with #3963
            this.dataSource.data = newMotions.sort((a, b) => {
                if (a.callListWeight !== b.callListWeight) {
                    return a.callListWeight - b.callListWeight;
                } else {
                    return a.id - b.id;
                }
            });
        });
        this.configService.get('motions_statutes_enabled').subscribe(
            (enabled: boolean): void => {
                this.statutesEnabled = enabled;
            }
        );
    }

    /**
     * The action performed on a click in single select modus
     * @param motion The row the user clicked at
     */
    public singleSelectAction(motion: ViewMotion): void {
        this.router.navigate(['./' + motion.id], { relativeTo: this.route });
    }

    /**
     * Get the icon to the corresponding Motion Status
     * TODO Needs to be more accessible (Motion workflow needs adjustment on the server)
     *
     * @param state the name of the state
     * @returns the icon string
     */
    public getStateIcon(state: WorkflowState): string {
        const stateName = state.name;
        if (stateName === 'accepted') {
            return 'thumb_up';
        } else if (stateName === 'rejected') {
            return 'thumb_down';
        } else if (stateName === 'not decided') {
            return 'help';
        } else {
            return '';
        }
    }

    /**
     * Determines if an icon should be shown in the list view
     *
     * @param state the workflowstate
     * @returns a boolean if the icon should be shown
     */
    public isDisplayIcon(state: WorkflowState): boolean {
        if (state) {
            return state.name === 'accepted' || state.name === 'rejected' || state.name === 'not decided';
        } else {
            return false;
        }
    }

    /**
     * Handler for the speakers button
     *
     * @param motion indicates the row that was clicked on
     */
    public onSpeakerIcon(motion: ViewMotion, event: MouseEvent): void {
        event.stopPropagation();
        this.router.navigate([`/agenda/${motion.agenda_item_id}/speakers`]);
    }

    /**
     * Handler for the plus button
     */
    public onPlusButton(): void {
        this.router.navigate(['./new'], { relativeTo: this.route });
    }

    /**
     * Export all motions as CSV
     */
    public csvExportMotionList(): void {
       this.motionCsvExport.exportMotionList(this.dataSource.data);
    }

    /**
     * Deletes the items selected.
     * SelectedRows is only filled with data in multiSelect mode
     */
    public async deleteSelected(): Promise<void> {
        const content = this.translate.instant('This will delete all selected motions.');
        if (await this.promptService.open('Are you sure?', content)) {
            for (const motion of this.selectedRows) {
                await this.repo.delete(motion);
            }
        }
    }

    /**
     * Set the status in bulk.
     * SelectedRows is only filled with data in multiSelect mode
     * TODO: currently not yet functional, because no status (or state_id) is being selected
     * in the ui
     * @param status TODO: May still change type
     */
    public async setStatusSelected(status: Partial<WorkflowState>): Promise<void> {
        // TODO: check if id is there
        for (const motion of this.selectedRows) {
            await this.repo.update({ state_id: status.id }, motion);
        }
    }

    /**
     * Set the category for all selected items.
     * SelectedRows is only filled with data in multiSelect mode
     * TODO: currently not yet functional, because no category is being selected in the ui
     * @param category TODO: May still change type
     */
    public async setCategorySelected(category: Partial<Category>): Promise<void> {
        for (const motion of this.selectedRows) {
            await this.repo.update({ state_id: category.id }, motion);
        }
    }

    /**
     * TODO: Open an extra submenu. Design still undecided. Will be used for deciding
     * the status of setStatusSelected
     */
    public openSetStatusMenu(): void {}

    /**
     * TODO: Open an extra submenu. Design still undecided. Will be used for deciding
     * the status of setCategorySelected
     */
    public openSetCategoryMenu(): void {}

    public getColumnDefinition(): string[] {
        if (this.isMultiSelect) {
            return ['selector'].concat(this.columnsToDisplayMinWidth);
        }
        return this.columnsToDisplayMinWidth;
    }
}
