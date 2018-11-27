import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';

import { ViewItem } from '../../models/view-item';
import { ListViewBaseComponent } from 'app/site/base/list-view-base';
import { AgendaRepositoryService } from '../../services/agenda-repository.service';
import { PromptService } from '../../../../core/services/prompt.service';

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
     * @param repo the agenda repository,
     * promptService:
     *
     */
    public constructor(
        titleService: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        private route: ActivatedRoute,
        private router: Router,
        private repo: AgendaRepositoryService,
        private promptService: PromptService
    ) {
        super(titleService, translate, matSnackBar);

        // activate multiSelect mode for this listview
        this.canMultiSelect = true;
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
            this.checkSelection();
        });
    }

    /**
     * Handler for click events on an agenda item row. Links to the content object
     * Gets content object from the repository rather than from the model
     * to avoid race conditions
     * @param item the item that was selected from the list view
     */
    public singleSelectAction(item: ViewItem): void {
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

    /**
     * Handler for deleting multiple entries. Needs items in selectedRows, which
     * is only filled with any data in multiSelect mode
     */
    public async deleteSelected(): Promise<void> {
        const content = this.translate.instant('This will delete all selected agenda items.');
        if (await this.promptService.open('Are you sure?', content)) {
            for (const agenda of this.selectedRows) {
                await this.repo.delete(agenda);
            }
        }
    }

    /**
     * Sets multiple entries' open/closed state. Needs items in selectedRows, which
     * is only filled with any data in multiSelect mode
     * @param closed true if the item is to be considered done
     */
    public async setClosedSelected(closed: boolean): Promise<void> {
        for (const agenda of this.selectedRows) {
            await this.repo.update({ closed: closed }, agenda);
        }
    }

    /**
     * Sets multiple entries' visibility. Needs items in selectedRows, which
     * is only filled with any data in multiSelect mode.
     * @param visible true if the item is to be shown
     */
    public async setVisibilitySelected(visible: boolean): Promise<void> {
        for (const agenda of this.selectedRows) {
            await this.repo.update({ is_hidden: visible }, agenda);
        }
    }

    public getColumnDefinition(): string[] {
        const list = ['title', 'duration', 'speakers'];
        if (this.isMultiSelect) {
            return ['selector'].concat(list);
        }
        return list;
    }
}
