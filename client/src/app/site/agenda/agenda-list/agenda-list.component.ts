import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { BaseComponent } from 'app/base.component';
import { TranslateService } from '@ngx-translate/core';

/**
 * List view for the agenda.
 *
 * TODO: Not yet implemented
 */
@Component({
    selector: 'app-agenda-list',
    templateUrl: './agenda-list.component.html',
    styleUrls: ['./agenda-list.component.css']
})
export class AgendaListComponent extends BaseComponent implements OnInit {
    /**
     * The usual constructor for components
     * @param titleService
     * @param translate
     */
    public constructor(titleService: Title, protected translate: TranslateService) {
        super(titleService, translate);
    }

    /**
     * Init function.
     * Sets the title
     */
    public ngOnInit() {
        super.setTitle('Agenda');
    }

    /**
     * Handler for the plus button.
     * Comes from the HeadBar Component
     */
    public onPlusButton() {
        console.log('create new motion');
    }
}
