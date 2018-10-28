import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { MotionRepositoryService } from '../../services/motion-repository.service';
import { ViewMotion } from '../../models/view-motion';
import { WorkflowState } from '../../../../shared/models/motions/workflow-state';
import { ListViewBaseComponent } from '../../../base/list-view-base';
import { MatSnackBar } from '@angular/material';
import { ConfigService } from "../../../../core/services/config.service";

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
    public columnsToDisplayMinWidth = ['identifier', 'title', 'state', 'speakers'];

    /**
     * Use for maximal width
     *
     * TODO: Needs vp.desktop check
     */
    public columnsToDisplayFullWidth = ['identifier', 'title', 'state', 'speakers'];

    /**
     * Value of the configuration variable `motions_statutes_enabled` - are statutes enabled?
     * @TODO replace by direct access to config variable, once it's available from the templates
     */
    public statutesEnabled: boolean;

    /**
     * Constructor implements title and translation Module.
     *
     * @param titleService Title
     * @param translate Translation
     * @param matSnackBar
     * @param router Router
     * @param route Current route
     * @param configService The configuration provider
     * @param repo Motion Repository
     */
    public constructor(
        titleService: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        private router: Router,
        private route: ActivatedRoute,
        private configService: ConfigService,
        private repo: MotionRepositoryService
    ) {
        super(titleService, translate, matSnackBar);
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
            // TODO: This is for testing purposes. Can be removed with #3963
            this.dataSource.data = newMotions.sort((a, b) => {
                if (a.weight !== b.weight) {
                    return a.weight - b.weight;
                } else {
                    return a.id - b.id;
                }
            });
        });
        this.configService.get('motions_statutes_enabled').subscribe((enabled: boolean): void => {
            this.statutesEnabled = enabled;
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
            return 'thumb_up';
        } else if (stateName === 'rejected') {
            return 'thumb_down';
        } else if (stateName === 'not decided') {
            return 'help';
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
     * Handler for the speakers button
     * @param motion indicates the row that was clicked on
     */
    public onSpeakerIcon(motion: ViewMotion): void {
        this.router.navigate([`/agenda/${motion.agenda_item_id}/speakers`]);
    }

    /**
     * Handler for the plus button
     */
    public onPlusButton(): void {
        this.router.navigate(['./new'], { relativeTo: this.route });
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
