import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Title } from '@angular/platform-browser';
import { ViewAssignment } from '../models/view-assignment';
import { ListViewBaseComponent } from '../../base/list-view-base';
import { AssignmentRepositoryService } from '../services/assignment-repository.service';
import { MatSnackBar } from '@angular/material';
import { PromptService } from '../../../core/services/prompt.service';

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
     *
     * @param titleService
     * @param translate
     * @param matSnackBar
     * @param repo the repository
     * @param promptService
     */
    public constructor(
        titleService: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        private repo: AssignmentRepositoryService,
        private promptService: PromptService
    ) {
        super(titleService, translate, matSnackBar);
        // activate multiSelect mode for this listview
        this.canMultiSelect = true;
    }

    /**
     * Init function.
     * Sets the title, inits the table and calls the repo.
     */
    public ngOnInit(): void {
        super.setTitle('Assignments');
        this.initTable();
        this.repo.getViewModelListObservable().subscribe(newAssignments => {
            this.dataSource.data = newAssignments;
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
