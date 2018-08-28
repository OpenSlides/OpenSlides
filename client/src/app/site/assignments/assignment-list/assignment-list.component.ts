import { Component, OnInit } from '@angular/core';
import { BaseComponent } from '../../../base.component';
import { TranslateService } from '@ngx-translate/core';
import { Title } from '@angular/platform-browser';

/**
 * Listview for the assignments
 *
 * TODO: not yet implemented
 */
@Component({
    selector: 'app-assignment-list',
    templateUrl: './assignment-list.component.html',
    styleUrls: ['./assignment-list.component.css']
})
export class AssignmentListComponent extends BaseComponent implements OnInit {
    /**
     * Constructor.
     * @param titleService
     * @param translate
     */
    constructor(titleService: Title, protected translate: TranslateService) {
        super(titleService, translate);
    }

    /**
     * Define the content of the ellipsis menu.
     * Give it to the HeadBar to display them.
     */
    assignmentMenu = [
        {
            text: 'Download All',
            icon: 'download',
            action: 'downloadAssignmentButton'
        }
    ];

    /**
     * Click on the plus button delegated from head-bar
     */
    onPlusButton() {
        console.log('create new assignments');
    }

    /**
     * Init function. Sets the title.
     */
    ngOnInit() {
        super.setTitle('Assignments');
    }

    /**
     * Function to download the assignment list
     * TODO: Not yet implemented
     */
    downloadAssignmentButton(): void {
        console.log('Hello World');
    }

    /**
     * handler function for clicking on items in the ellipsis menu.
     *
     * @param event clicked entry from ellipsis menu
     */
    onEllipsisItem(event: any) {
        if (event.action) {
            this[event.action]();
        }
    }
}
