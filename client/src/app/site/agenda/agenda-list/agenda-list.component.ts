import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { ViewItem } from '../models/view-item';
import { ListViewBaseComponent } from '../../base/list-view-base';
import { AgendaRepositoryService } from '../services/agenda-repository.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material';

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
export class AgendaListComponent extends ListViewBaseComponent<ViewItem> implements OnInit {
    /**
     * The usual constructor for components
     * @param titleService
     * @param translate
     * @param matSnackBar
     * @param router
     * @param repo
     */
    public constructor(
        titleService: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        private router: Router,
        private repo: AgendaRepositoryService
    ) {
        super(titleService, translate, matSnackBar);
    }

    /**
     * Init function.
     * Sets the title, initializes the table and calls the repository.
     */
    public ngOnInit(): void {
        super.setTitle('Agenda');
        this.initTable();
        this.repo.getViewModelListObservable().subscribe(newAgendaItem => {
            this.dataSource.data = newAgendaItem;
        });
    }

    /**
     * Handler for click events on agenda item rows
     * Links to the content object if any
     */
    public selectAgendaItem(item: ViewItem): void {
        if (item.contentObject) {
            this.router.navigate([item.contentObject.getDetailStateURL()]);
        } else {
            console.error(`The selected item ${item} has no content object`);
        }
    }

    /**
     * Handler for the plus button.
     * Comes from the HeadBar Component
     */
    public onPlusButton(): void {
        console.log('create new motion');
    }
}
