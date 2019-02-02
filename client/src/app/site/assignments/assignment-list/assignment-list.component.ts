import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';
import { Title } from '@angular/platform-browser';

import { AssignmentFilterListService } from '../services/assignment-filter.service';
import { AssignmentRepositoryService } from 'app/core/repositories/assignments/assignment-repository.service';
import { ListViewBaseComponent } from '../../base/list-view-base';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { ViewAssignment } from '../models/view-assignment';
import { AssignmentSortListService } from '../services/assignment-sort-list.service';

/**
 * Listview for the assignments
 *
 */
@Component({
    selector: 'os-assignment-list',
    templateUrl: './assignment-list.component.html',
    styleUrls: ['./assignment-list.component.scss']
})
export class AssignmentListComponent extends ListViewBaseComponent<ViewAssignment> implements OnInit {
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
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        public repo: AssignmentRepositoryService,
        private promptService: PromptService,
        public filterService: AssignmentFilterListService,
        public sortService: AssignmentSortListService
    ) {
        super(titleService, translate, matSnackBar);
        // activate multiSelect mode for this listview
        this.canMultiSelect = true;
    }

    /**
     * Init function.
     * Sets the title, inits the table, sets sorting and filter definitions, subscribes to filtered
     * data and sorting service
     */
    public ngOnInit(): void {
        super.setTitle('Assignments');
        this.initTable();

        this.filterService.filter().subscribe(filteredData => {
            this.sortService.data = filteredData;
        });
        this.sortService.sort().subscribe(sortedData => {
            this.dataSource.data = sortedData;
            this.checkSelection();
        });
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
        const content = this.translate.instant('This will delete all selected assignments.');
        if (await this.promptService.open('Are you sure?', content)) {
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
