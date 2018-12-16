import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { MatSnackBar, MatDialog } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';

import { ViewItem } from '../../models/view-item';
import { ListViewBaseComponent } from 'app/site/base/list-view-base';
import { AgendaRepositoryService } from '../../services/agenda-repository.service';
import { PromptService } from '../../../../core/services/prompt.service';
import { ItemInfoDialogComponent } from '../item-info-dialog/item-info-dialog.component';
import { ViewportService } from 'app/core/services/viewport.service';
import { DurationService } from 'app/site/core/services/duration.service';
import { ConfigService } from 'app/core/services/config.service';

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
     * Determine the display columns in desktop view
     */
    public displayedColumnsDesktop: string[] = ['title', 'info', 'speakers', 'menu'];

    /**
     * Determine the display columns in mobile view
     */
    public displayedColumnsMobile: string[] = ['title', 'menu'];

    public isNumberingAllowed: boolean;

    /**
     * The usual constructor for components
     * @param titleService Setting the browser tab title
     * @param translate translations
     * @param matSnackBar Shows errors and messages
     * @param route Angulars ActivatedRoute
     * @param router Angulars router
     * @param repo the agenda repository,
     * @param promptService the delete prompt
     * @param dialog to change info values
     * @param config read out config values
     * @param vp determine the viewport
     * @param durationService Converts numbers to readable duration strings
     */
    public constructor(
        titleService: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        private route: ActivatedRoute,
        private router: Router,
        private repo: AgendaRepositoryService,
        private promptService: PromptService,
        private dialog: MatDialog,
        private config: ConfigService,
        public vp: ViewportService,
        public durationService: DurationService
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

        this.config
            .get('agenda_enable_numbering')
            .subscribe(autoNumbering => (this.isNumberingAllowed = autoNumbering));
    }

    /**
     * Links to the content object.
     * Gets content object from the repository rather than from the model
     * to avoid race conditions
     *
     * @param item the item that was selected from the list view
     */
    public singleSelectAction(item: ViewItem): void {
        const contentObject = this.repo.getContentObject(item.item);
        this.router.navigate([contentObject.getDetailStateURL()]);
    }

    /**
     * Opens the item-info-dialog.
     * Enable direct changing of various information
     *
     * @param item The view item that was clicked
     */
    public openEditInfo(item: ViewItem): void {
        const dialogRef = this.dialog.open(ItemInfoDialogComponent, {
            width: '400px',
            data: item
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                if (result.durationText) {
                    result.duration = this.durationService.stringToDuration(result.durationText);
                }
                this.repo.update(result, item);
            }
        });
    }

    /**
     * Click handler for the numbering button to enable auto numbering
     */
    public async onAutoNumbering(): Promise<void> {
        const content = this.translate.instant('Are you sure you want to number all agenda items?');
        if (await this.promptService.open('', content)) {
            await this.repo.autoNumbering().then(null, this.raiseError);
        }
    }

    /**
     * Click handler for the done button in the dot-menu
     */
    public async onDoneSingleButton(item: ViewItem): Promise<void> {
        await this.repo.update({ closed: !item.closed }, item).then(null, this.raiseError);
    }

    /**
     * Handler for the speakers button
     *
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
     * Delete handler for a single item
     *
     * @param item The item to delete
     */
    public async onDelete(item: ViewItem): Promise<void> {
        const content = this.translate.instant('Delete') + ` ${item.getTitle()}?`;
        if (await this.promptService.open('Are you sure?', content)) {
            await this.repo.delete(item).then(null, this.raiseError);
        }
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
     *
     * @param closed true if the item is to be considered done
     */
    public async setClosedSelected(closed: boolean): Promise<void> {
        for (const agenda of this.selectedRows) {
            await this.repo.update({ closed: closed }, agenda);
        }
    }

    /**
     * Sets multiple entries' agenda type. Needs items in selectedRows, which
     * is only filled with any data in multiSelect mode.
     *
     * @param visible true if the item is to be shown
     */
    public async setAgendaType(agendaType: number): Promise<void> {
        for (const agenda of this.selectedRows) {
            await this.repo.update({ type: agendaType }, agenda).then(null, this.raiseError);
        }
    }

    /**
     * Determine what columns to show
     *
     * @returns an array of strings with the dialogs to show
     */
    public getColumnDefinition(): string[] {
        const list = this.vp.isMobile ? this.displayedColumnsMobile : this.displayedColumnsDesktop;
        if (this.isMultiSelect) {
            return ['selector'].concat(list);
        }
        return list;
    }
}
