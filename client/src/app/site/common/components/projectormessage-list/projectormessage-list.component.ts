import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { BaseViewComponent } from '../../../base/base-view';
import { MatSnackBar } from '@angular/material';

/**
 * List view for the statute paragraphs.
 */
@Component({
    selector: 'os-projectormessage-list',
    templateUrl: './projectormessage-list.component.html',
    styleUrls: ['./projectormessage-list.component.scss']
})
export class ProjectorMessageListComponent extends BaseViewComponent implements OnInit {
    public constructor(titleService: Title, translate: TranslateService, matSnackBar: MatSnackBar) {
        super(titleService, translate, matSnackBar);
    }

    /**
     * Init function.
     *
     * Sets the title and gets/observes countdowns from DataStore
     */
    public ngOnInit(): void {
        super.setTitle('Messages');
    }

    public onPlusButton(): void {}
}
