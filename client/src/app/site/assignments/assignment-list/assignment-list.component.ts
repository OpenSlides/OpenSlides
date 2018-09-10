import { Component, OnInit } from '@angular/core';
import { BaseComponent } from '../../../base.component';
import { TranslateService } from '@ngx-translate/core';
import { Title } from '@angular/platform-browser';
import { Assignment } from '../../../shared/models/assignments/assignment';

/**
 * Listview for the assignments
 *
 * TODO: not yet implemented
 */
@Component({
    selector: 'os-assignment-list',
    templateUrl: './assignment-list.component.html',
    styleUrls: ['./assignment-list.component.css']
})
export class AssignmentListComponent extends BaseComponent implements OnInit {
    /**
     * Define the content of the ellipsis menu.
     * Give it to the HeadBar to display them.
     */
    public assignmentMenu = [
        {
            text: 'Download All',
            icon: 'download',
            action: 'downloadAssignmentButton'
        }
    ];

    /**
     * Constructor.
     * @param titleService
     * @param translate
     */
    public constructor(titleService: Title, protected translate: TranslateService) {
        super(titleService, translate);
    }

    /**
     * Click on the plus button delegated from head-bar
     */
    public onPlusButton(): void {
        console.log('create new assignments');
    }

    /**
     * Init function. Sets the title.
     */
    public ngOnInit(): void {
        super.setTitle('Assignments');

        // tslint:disable-next-line
        const a: Assignment = new Assignment(); // Needed, that the Assignment.ts is loaded. Can be removed, if something else creates/uses assignments.
    }

    /**
     * Function to download the assignment list
     * TODO: Not yet implemented
     */
    public downloadAssignmentButton(): void {
        console.log('Hello World');
    }

    /**
     * handler function for clicking on items in the ellipsis menu.
     *
     * @param event clicked entry from ellipsis menu
     */
    public onEllipsisItem(event: any): void {
        if (event.action) {
            this[event.action]();
        }
    }
}
