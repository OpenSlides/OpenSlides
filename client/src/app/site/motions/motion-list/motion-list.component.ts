import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { BaseComponent } from 'app/base.component';
import { TranslateService } from '@ngx-translate/core';
import { Motion } from '../../../shared/models/motions/motion';
import { MatTable, MatPaginator, MatSort, MatTableDataSource } from '@angular/material';
import { Workflow } from '../../../shared/models/motions/workflow';

/**
 * Component that displays all the motions in a Table using DataSource.
 */
@Component({
    selector: 'app-motion-list',
    templateUrl: './motion-list.component.html',
    styleUrls: ['./motion-list.component.scss']
})
export class MotionListComponent extends BaseComponent implements OnInit {
    /**
     * Store motion workflows (to check the status of the motions)
     */
    public workflowArray: Array<Workflow>;

    /**
     * Store the motions
     */
    public motionArray: Array<Motion>;

    /**
     * Will be processed by the mat-table
     */
    public dataSource: MatTableDataSource<Motion>;

    /**
     * The table itself.
     */
    @ViewChild(MatTable) public table: MatTable<Motion>;

    /**
     * Pagination. Might be turned off to all motions at once.
     */
    @ViewChild(MatPaginator) public paginator: MatPaginator;

    /**
     * Sort the Table
     */
    @ViewChild(MatSort) public sort: MatSort;

    /**
     * Use for minimal width
     */
    public columnsToDisplayMinWidth = ['identifier', 'title', 'state'];

    /**
     * Use for maximal width
     */
    public columnsToDisplayFullWidth = ['identifier', 'title', 'meta', 'state'];

    /**
     * content of the ellipsis menu
     */
    public motionMenuList = [
        {
            text: 'Download',
            icon: 'download',
            action: 'downloadMotions'
        },
        {
            text: 'Categories',
            action: 'toCategories'
        }
    ];

    /**
     * Constructor implements title and translation Module.
     *
     * @param titleService Title
     * @param translate Translation
     * @param router Router
     * @param route Current route
     */
    public constructor(
        protected titleService: Title,
        protected translate: TranslateService,
        private router: Router,
        private route: ActivatedRoute
    ) {
        super(titleService, translate);
    }

    /**
     * Init function
     */
    public ngOnInit() {
        super.setTitle('Motions');
        this.workflowArray = this.DS.get(Workflow) as Workflow[];
        this.motionArray = this.DS.get(Motion) as Motion[];
        this.dataSource = new MatTableDataSource(this.motionArray);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;

        // Observe DataStore for motions. Initially, executes once for every motion.
        // The alternative approach is to put the observable as DataSource to the table
        this.DS.getObservable().subscribe(newModel => {
            if (newModel instanceof Motion) {
                this.motionArray = this.DS.get(Motion) as Motion[];
                this.dataSource.data = this.motionArray;
            }
        });
    }

    /**
     * Select a motion from list. Executed via click.
     *
     * @param motion The row the user clicked at
     */
    public selectMotion(motion) {
        this.router.navigate(['./' + motion.id], { relativeTo: this.route });
    }

    /**
     * Get the icon to the coresponding Motion Status
     * TODO Needs to be more accessible (Motion workflow needs adjustment on the server)
     * @param state the name of the state
     */
    public getStateIcon(state) {
        const stateName = state.name;
        if (stateName === 'accepted') {
            return 'thumbs-up';
        } else if (stateName === 'rejected') {
            return 'thumbs-down';
        } else if (stateName === 'not decided') {
            return 'question';
        } else {
            return '';
        }
    }

    /**
     * Determines if an icon should be shown in the list view
     * @param state
     */
    public isDisplayIcon(state): boolean {
        return state.name === 'accepted' || state.name === 'rejected' || state.name === 'not decided';
    }

    /**
     * Handler for the plus button
     */
    public onPlusButton() {
        this.router.navigate(['./new'], { relativeTo: this.route });
    }

    /**
     * navigate to 'motion/category'
     */
    public toCategories() {
        this.router.navigate(['./category'], { relativeTo: this.route });
    }

    /**
     * Download all motions As PDF and DocX
     *
     * TODO: Currently does nothing
     */
    public downloadMotions() {
        console.log('Download Motions Button');
    }

    /**
     * handler function for clicking on items in the ellipsis menu.
     *
     * @param event clicked entry from ellipsis menu
     */
    public onEllipsisItem(event: any) {
        if (event.action) {
            this[event.action]();
        }
    }
}
