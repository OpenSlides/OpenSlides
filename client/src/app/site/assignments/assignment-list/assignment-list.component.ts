import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Title } from '@angular/platform-browser';
import { ViewAssignment } from '../models/view-assignment';
import { ListViewBaseComponent } from '../../base/list-view-base';
import { AssignmentRepositoryService } from '../services/assignment-repository.service';

/**
 * Listview for the assignments
 *
 */
@Component({
    selector: 'os-assignment-list',
    templateUrl: './assignment-list.component.html',
    styleUrls: ['./assignment-list.component.css']
})
export class AssignmentListComponent extends ListViewBaseComponent<ViewAssignment> implements OnInit {
    /**
     * Define the content of the ellipsis menu.
     * Give it to the HeadBar to display them.
     */
    public assignmentMenu = [
        {
            text: 'Download All',
            icon: 'save_alt',
            action: 'downloadAssignmentButton'
        }
    ];

    /**
     * Constructor.
     *
     * @param repo the repository
     * @param titleService
     * @param translate
     */
    public constructor(private repo: AssignmentRepositoryService, titleService: Title, translate: TranslateService) {
        super(titleService, translate);
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
