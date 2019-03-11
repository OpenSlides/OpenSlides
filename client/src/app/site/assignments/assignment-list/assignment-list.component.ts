import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';
import { Title } from '@angular/platform-browser';

import { Assignment } from 'app/shared/models/assignments/assignment';
import { AssignmentFilterListService } from '../services/assignment-filter.service';
import { AssignmentSortListService } from '../services/assignment-sort-list.service';
import { AssignmentRepositoryService } from 'app/core/repositories/assignments/assignment-repository.service';
import { ListViewBaseComponent } from '../../base/list-view-base';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { ViewAssignment } from '../models/view-assignment';

/**
 * Listview for the assignments
 *
 */
@Component({
    selector: 'os-assignment-list',
    templateUrl: './assignment-list.component.html',
    styleUrls: ['./assignment-list.component.scss']
})
export class AssignmentListComponent extends ListViewBaseComponent<ViewAssignment, Assignment> implements OnInit {
    /**
     * Constructor.
     * @param titleService
     * @param translate
     * @param matSnackBar
     * @param repo the repository
     * @param promptService
     * @param filterService: A service to supply the filtered datasource
     * @param sortService: Service to sort the filtered dataSource
     */
    public constructor(
        titleService: Title,
        protected translate: TranslateService, // protected required for ng-translate-extract
        matSnackBar: MatSnackBar,
        public repo: AssignmentRepositoryService,
        private promptService: PromptService,
        public filterService: AssignmentFilterListService,
        public sortService: AssignmentSortListService
    ) {
        super(titleService, translate, matSnackBar, filterService, sortService);
        // activate multiSelect mode for this listview
        this.canMultiSelect = true;
    }

    /**
     * Init function.
     * Sets the title, inits the table, sets sorting and filter definitions, subscribes to filtered
     * data and sorting service
     */
    public ngOnInit(): void {
        super.setTitle(this.translate.instant('Elections'));
        this.initTable();
    }

    /**
     * Click on the plus button delegated from head-bar
     */
    public onPlusButton(): void {
        console.log('create new assignments');
    }

    /**
     * Action to be performed after a click on a row in the table, if in single select mode
     * @param assignment The entry of row clicked
     */
    public singleSelectAction(assignment: ViewAssignment): void {
        console.log('select assignment list: ', assignment);
    }

    /**
     * Function to download the assignment list
     * TODO: Not yet implemented
     */
    public downloadAssignmentButton(): void {
        console.log('Hello World');
    }

    /**
     * Handler for deleting multiple entries. Needs items in selectedRows, which
     * is only filled with any data in multiSelect mode
     */
    public async deleteSelected(): Promise<void> {
        const title = this.translate.instant('Are you sure you want to delete all selected elections?');
        if (await this.promptService.open(title, null)) {
            for (const assignment of this.selectedRows) {
                await this.repo.delete(assignment);
            }
        }
    }

    public getColumnDefintion(): string[] {
        const list = ['title', 'phase', 'candidates'];
        if (this.isMultiSelect) {
            return ['selector'].concat(list);
        }
        return list;
    }
}
