import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { MotionRepositoryService } from '../../services/motion-repository.service';
import { ViewMotion } from '../../models/view-motion';
import { WorkflowState } from '../../../../shared/models/motions/workflow-state';
import { ListViewBaseComponent } from '../../../base/list-view-base';

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
            action: 'toCategories',
            perm: 'motions.can_manage'
        },
        {
            text: 'Motion comment sections',
            action: 'toMotionCommentSections',
            perm: 'motions.can_manage'
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
        titleService: Title,
        translate: TranslateService,
        private router: Router,
        private route: ActivatedRoute,
        private repo: MotionRepositoryService
    ) {
        super(titleService, translate);
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
     * navigate to 'motion/comment-section'
     */
    public toMotionCommentSections(): void {
        this.router.navigate(['./comment-section'], { relativeTo: this.route });
    }

    /**
     * Download all motions As PDF and DocX
     *
     * TODO: Currently does nothing
     */
    public downloadMotions(): void {
        console.log('Download Motions Button');
    }
}
