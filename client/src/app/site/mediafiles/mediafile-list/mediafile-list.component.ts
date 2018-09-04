import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { BaseComponent } from '../../../base.component';

/**
 * Lists all the uploaded mediafiles.
 *
 * Not yet implemented
 */
@Component({
    selector: 'os-mediafile-list',
    templateUrl: './mediafile-list.component.html',
    styleUrls: ['./mediafile-list.component.css']
})
export class MediafileListComponent extends BaseComponent implements OnInit {
    /**
     * Define the content of the ellipsis menu.
     * Give it to the HeadBar to display them.
     */
    public extraMenu = [
        {
            text: 'Download',
            icon: 'download',
            action: 'downloadAllFiles'
        }
    ];

    /**
     * Constructor
     *
     * @param titleService
     * @param translate
     */
    public constructor(titleService: Title, protected translate: TranslateService) {
        super(titleService, translate);
    }

    /**
     * Init.
     * Set the title
     */
    public ngOnInit() {
        super.setTitle('Files');
    }

    /**
     * Click on the plus button delegated from head-bar
     */
    public onPlusButton() {
        console.log('clicked plus (mediafile)');
    }

    /**
     * function to Download all files
     * (serves as example to use functions on head bar)
     *
     * TODO: Not yet implemented, might not even be required
     */
    public deleteAllFiles() {
        console.log('do download');
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
