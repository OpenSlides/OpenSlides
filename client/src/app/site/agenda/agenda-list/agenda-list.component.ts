import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { BaseComponent } from 'app/base.component';
import { TranslateService } from '@ngx-translate/core';
import { Item } from '../../../shared/models/agenda/item';
import { Topic } from '../../../shared/models/topics/topic';

/**
 * List view for the agenda.
 *
 * TODO: Not yet implemented
 */
@Component({
    selector: 'os-agenda-list',
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
    public ngOnInit(): void {
        super.setTitle('Agenda');
        // tslint:disable-next-line
        const i: Item = new Item(); // Needed, that the Item.ts is loaded. Can be removed, if something else creates/uses items.
        // tslint:disable-next-line
        const t: Topic = new Topic(); // Needed, that the Topic.ts is loaded. Can be removed, if something else creates/uses topics.
    }

    /**
     * Handler for the plus button.
     * Comes from the HeadBar Component
     */
    public onPlusButton(): void {
        console.log('create new motion');
    }
}
