import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { BaseComponent } from 'app/base.component';
import { TranslateService } from '@ngx-translate/core';
import { Motion } from '../../../shared/models/motions/motion';
import { MatTable, MatPaginator, MatSort, MatTableDataSource } from '@angular/material';
import { Workflow } from '../../../shared/models/motions/workflow';

@Component({
    selector: 'app-motion-list',
    templateUrl: './motion-list.component.html',
    styleUrls: ['./motion-list.component.scss']
})
export class MotionListComponent extends BaseComponent implements OnInit {
    /**
     * Store motion workflows (to check the status of the motions)
     */
    workflowArray: Array<Workflow>;

    /**
     * Store the motions
     */
    motionArray: Array<Motion>;

    /**
     * Will be processed by the mat-table
     */
    dataSource: MatTableDataSource<Motion>;

    @ViewChild(MatTable) table: MatTable<Motion>;
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;

    /**
     * Use for minimal width
     */
    columnsToDisplayMinWidth = ['identifier', 'title', 'state'];
    /**
     * Use for maximal width
     */
    columnsToDisplayFullWidth = ['identifier', 'title', 'meta', 'state'];

    /**
     * Constructor implements title and translation Module.
     * @param titleService
     * @param translate
     */
    constructor(
        public router: Router,
        titleService: Title,
        protected translate: TranslateService,
        private route: ActivatedRoute
    ) {
        super(titleService, translate);
    }

    /**
     * Init function
     */
    ngOnInit() {
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
                this.motionArray.push(newModel as Motion);
                this.dataSource.data = this.motionArray;
            }
        });
    }

    selectMotion(motion) {
        console.log('clicked a row, :', motion);

        this.router.navigate(['./' + motion.id], { relativeTo: this.route });
    }

    /**
     * Get the icon to the coresponding Motion Status
     * TODO Needs to be more accessible (Motion workflow needs adjustment on the server)
     * @param stateName the name of the state
     */
    getStateIcon(stateName) {
        if (stateName === 'accepted') {
            return 'thumbs-up';
        } else if (stateName === 'rejected') {
            return 'thumbs-down';
        } else if (stateName === 'not decided') {
            return 'question';
        }
    }

    /**
     * Download all motions As PDF and DocX
     */
    downloadMotionsButton() {
        console.log('Download Motions Button');
    }
}
