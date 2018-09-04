import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { MatTable, MatPaginator, MatSort, MatTableDataSource } from '@angular/material';

import { TranslateService } from '@ngx-translate/core';

import { BaseComponent } from '../../../../base.component';
import { MotionRepositoryService } from '../../services/motion-repository.service';
import { ViewMotion } from '../../models/view-motion';
import { WorkflowState } from '../../../../shared/models/motions/workflow-state';

/**
 * Component that displays all the motions in a Table using DataSource.
 */
@Component({
    selector: 'os-motion-list',
    templateUrl: './motion-list.component.html',
    styleUrls: ['./motion-list.component.scss']
})
export class MotionListComponent extends BaseComponent implements OnInit {
    /**
     * Will be processed by the mat-table
     *
     * Will represent the object that comes from the repository
     */
    public dataSource: MatTableDataSource<ViewMotion>;

    /**
     * The table itself.
     */
    @ViewChild(MatTable) public table: MatTable<ViewMotion>;

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
     *
     * TODO: Needs vp.desktop check
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
     * @param repo Motion Repository
     */
    public constructor(
        protected titleService: Title,
        protected translate: TranslateService,
        private router: Router,
        private route: ActivatedRoute,
        private repo: MotionRepositoryService
    ) {
        super(titleService, translate);
    }

    /**
     * Init function
     */
    public ngOnInit(): void {
        super.setTitle('Motions');

        this.dataSource = new MatTableDataSource();
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;

        this.repo.getViewMotionListObservable().subscribe(newMotions => {
            this.dataSource.data = newMotions;
        });
    }

    /**
     * Select a motion from list. Executed via click.
     *
     * @param motion The row the user clicked at
     */
    public selectMotion(motion: ViewMotion): void {
        this.router.navigate(['./' + motion.id], { relativeTo: this.route });
    }

    /**
     * Get the icon to the corresponding Motion Status
     * TODO Needs to be more accessible (Motion workflow needs adjustment on the server)
     * @param state the name of the state
     */
    public getStateIcon(state: WorkflowState): string {
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
    public isDisplayIcon(state: WorkflowState): boolean {
        if (state) {
            return state.name === 'accepted' || state.name === 'rejected' || state.name === 'not decided';
        } else {
            return false;
        }
    }

    /**
     * Handler for the plus button
     */
    public onPlusButton(): void {
        this.router.navigate(['./new'], { relativeTo: this.route });
    }

    /**
     * navigate to 'motion/category'
     */
    public toCategories(): void {
        this.router.navigate(['./category'], { relativeTo: this.route });
    }

    /**
     * Download all motions As PDF and DocX
     *
     * TODO: Currently does nothing
     */
    public downloadMotions(): void {
        console.log('Download Motions Button');
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
