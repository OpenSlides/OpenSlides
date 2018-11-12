import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material';

import { TranslateService } from '@ngx-translate/core';
import { ViewItem } from '../../models/view-item';
import { ListViewBaseComponent } from 'app/site/base/list-view-base';
import { AgendaRepositoryService } from '../../services/agenda-repository.service';

/**
 * List view for the agenda.
 */
@Component({
    selector: 'os-agenda-list',
    templateUrl: './agenda-list.component.html',
    styleUrls: ['./agenda-list.component.scss']
})
export class AgendaListComponent extends ListViewBaseComponent<ViewItem> implements OnInit {
    /**
     * The usual constructor for components
     * @param titleService Setting the browser tab title
     * @param translate translations
     * @param matSnackBar Shows errors and messages
     * @param route Angulars ActivatedRoute
     * @param router Angulars router
     * @param repo the agenda repository
     */
    public constructor(
        titleService: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        private route: ActivatedRoute,
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
     *
     * Gets content object from the repository rather than from the model
     * to avoid race conditions
     * @param item the item that was selected from the list view
     */
    public selectAgendaItem(item: ViewItem): void {
        const contentObject = this.repo.getContentObject(item.item);
        this.router.navigate([contentObject.getDetailStateURL()]);
    }

    /**
     * Handler for the speakers button
     * @param item indicates the row that was clicked on
     */
    public onSpeakerIcon(item: ViewItem): void {
        this.router.navigate([`${item.id}/speakers`], { relativeTo: this.route });
    }

    /**
     * Handler for the plus button.
     * Comes from the HeadBar Component
     */
    public onPlusButton(): void {
        this.router.navigate(['topics/new'], { relativeTo: this.route });
    }
}
