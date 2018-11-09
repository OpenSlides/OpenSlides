import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Title } from '@angular/platform-browser';
import { ViewAssignment } from '../models/view-assignment';
import { ListViewBaseComponent } from '../../base/list-view-base';
import { AssignmentRepositoryService } from '../services/assignment-repository.service';
import { MatSnackBar } from '@angular/material';

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
     */
    public constructor(
        titleService: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        private repo: AssignmentRepositoryService
    ) {
        super(titleService, translate, matSnackBar);
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
        });
    }

    /**
     * Click on the plus button delegated from head-bar
     */
    public onPlusButton(): void {
        console.log('create new assignments');
    }

    /**
     * Select an row in the table
     * @param assignment
     */
    public selectAssignment(assignment: ViewAssignment): void {
        console.log('select assignment list: ', assignment);
    }

    /**
     * Function to download the assignment list
     * TODO: Not yet implemented
     */
    public downloadAssignmentButton(): void {
        console.log('Hello World');
    }
}
