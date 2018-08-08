import { Component, OnInit, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { BaseComponent } from 'app/base.component';
import { TranslateService } from '@ngx-translate/core';
import { Motion } from '../../../shared/models/motions/motion';
import { MatPaginator, MatSort, MatTableDataSource } from '@angular/material';
import { Workflow } from '../../../shared/models/motions/workflow';

export interface PeriodicElement {
    state_id: string;
    identifier: number;
    weight: number;
    symbol: string;
}

const ELEMENT_DATA: PeriodicElement[] = [
    { identifier: 1, state_id: 'Hydrogen', weight: 1.0079, symbol: 'H' },
    { identifier: 2, state_id: 'Helium', weight: 4.0026, symbol: 'He' },
    { identifier: 3, state_id: 'Lithium', weight: 6.941, symbol: 'Li' },
    { identifier: 4, state_id: 'Beryllium', weight: 9.0122, symbol: 'Be' },
    { identifier: 5, state_id: 'Boron', weight: 10.811, symbol: 'B' },
    { identifier: 6, state_id: 'Carbon', weight: 12.0107, symbol: 'C' },
    { identifier: 7, state_id: 'Nitrogen', weight: 14.0067, symbol: 'N' },
    { identifier: 8, state_id: 'Oxygen', weight: 15.9994, symbol: 'O' },
    { identifier: 9, state_id: 'Fluorine', weight: 18.9984, symbol: 'F' },
    { identifier: 10, state_id: 'Neon', weight: 20.1797, symbol: 'Ne' }
];

@Component({
    selector: 'app-motion-list',
    templateUrl: './motion-list.component.html',
    styleUrls: ['./motion-list.component.scss']
})
export class MotionListComponent extends BaseComponent implements OnInit {
    workflowArray: Array<Workflow>;
    motionArray: Array<Motion>;
    dataSource: MatTableDataSource<Motion>;
    // dataSource: MatTableDataSource<any>;

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;

    /** which colummns to display in the table */
    columnsToDisplayMinWidth = ['identifier', 'title', 'state'];
    // columnsToDisplayMinWidth = ['title'];
    columnsToDisplayFullWidth = ['identifier', 'title', 'meta', 'state'];

    constructor(titleService: Title, protected translate: TranslateService) {
        super(titleService, translate);
    }

    ngOnInit() {
        super.setTitle('Motions');

        this.workflowArray = this.DS.get(Workflow) as Workflow[];
        this.motionArray = this.DS.get(Motion) as Motion[];
        this.dataSource = new MatTableDataSource(this.motionArray);
        // this.dataSource = new MatTableDataSource(ELEMENT_DATA);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
    }

    getStateIcon(stateName) {
        if (stateName === 'accepted') {
            return 'thumbs-up';
        } else if (stateName === 'rejected') {
            return 'thumbs-down';
        } else if (stateName === 'not decided') {
            return 'question';
        }
    }

    downloadMotionsButton() {
        console.log('Download Motions Button');
    }
}
