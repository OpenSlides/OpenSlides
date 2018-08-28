import { Component, OnInit, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { BaseComponent } from '../../../base.component';

/**
 * Lists all the uploaded mediafiles.
 *
 * Not yet implemented
 */
@Component({
    selector: 'app-mediafile-list',
    templateUrl: './mediafile-list.component.html',
    styleUrls: ['./mediafile-list.component.css']
})
export class MediafileListComponent extends BaseComponent implements OnInit {
    /**
     * Constructor
     *
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
    extraMenu = [
        {
            text: 'Download',
            icon: 'download',
            action: 'downloadAllFiles'
        }
    ];

    /**
     * Init.
     * Set the title
     */
    ngOnInit() {
        super.setTitle('Files');
    }

    /**
     * Click on the plus button delegated from head-bar
     */
    onPlusButton() {
        console.log('clicked plus (mediafile)');
    }

    /**
     * function to Download all files
     * (serves as example to use functions on head bar)
     *
     * TODO: Not yet implemented, might not even be required
     */
    deleteAllFiles() {
        console.log('do download');
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
