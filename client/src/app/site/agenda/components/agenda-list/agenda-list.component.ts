import { Component, OnInit } from '@angular/core';
import { MatSnackBar, MatDialog } from '@angular/material';
import { Router, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';

import { AgendaFilterListService } from '../../services/agenda-filter-list.service';
import { ItemRepositoryService } from 'app/core/repositories/agenda/item-repository.service';
import { ListViewBaseComponent } from 'app/site/base/list-view-base';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { ViewItem } from '../../models/view-item';

import { AgendaCsvExportService } from '../../services/agenda-csv-export.service';
import { AgendaPdfService } from '../../services/agenda-pdf.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { DurationService } from 'app/core/ui-services/duration.service';
import { ItemInfoDialogComponent } from '../item-info-dialog/item-info-dialog.component';
import { PdfDocumentService } from 'app/core/ui-services/pdf-document.service';
import { ViewportService } from 'app/core/ui-services/viewport.service';

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
     * @param csvExport Handles the exporting into csv
     * @param filterService: service for filtering data
     * @param agendaPdfService: service for preparing a pdf of the agenda
     * @param pdfService: Service for exporting a pdf
     */
    public constructor(
        titleService: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        private route: ActivatedRoute,
        private router: Router,
        private repo: ItemRepositoryService,
        private promptService: PromptService,
        private dialog: MatDialog,
        private config: ConfigService,
        public vp: ViewportService,
        public durationService: DurationService,
        private csvExport: AgendaCsvExportService,
        public filterService: AgendaFilterListService,
        private agendaPdfService: AgendaPdfService,
        private pdfService: PdfDocumentService
    ) {
        super(titleService, translate, matSnackBar);

        // activate multiSelect mode for this listview
        this.canMultiSelect = true;
    }

    /**
     * Init function.
     * Sets the title, initializes the table and filter options, subscribes to filter service.
     */
    public ngOnInit(): void {
        super.setTitle('Agenda');
        this.initTable();
        this.filterService.filter().subscribe(newAgendaItems => {
            newAgendaItems.sort((a, b) => a.agendaListWeight - b.agendaListWeight);
            this.dataSource.data = newAgendaItems;
            this.checkSelection();
        });
        this.config
            .get<boolean>('agenda_enable_numbering')
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
            data: item,
            disableClose: true
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                if (result.durationText) {
                    result.duration = this.durationService.stringToDuration(result.durationText);
                } else {
                    result.duration = 0;
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

    /**
     * Export all items as CSV
     */
    public csvExportItemList(): void {
        this.csvExport.exportItemList(this.dataSource.filteredData);
    }

    /**
     * Triggers the export of the agenda. Currently filtered items and 'hidden'
     * items will not be exported
     */
    public onDownloadPdf(): void {
        const filename = this.translate.instant('Agenda');
        this.pdfService.download(this.agendaPdfService.agendaListToDocDef(this.dataSource.filteredData), filename);
    }

    /**
     * Get the calculated end date and time
     *
     * @returns a readable string with end date and time in the current languages' convention
     */
    public getDurationEndString(): string {
        const duration = this.repo.calculateDuration();
        if (!duration) {
            return '';
        }
        const durationString = this.durationService.durationToString(duration);
        const endTime = this.repo.calculateEndTime();
        const result = `${this.translate.instant('Duration')}: ${durationString}`;
        if (endTime) {
            return (
                result +
                ` (${this.translate.instant('Estimated end')}:
            ${endTime.toLocaleTimeString(this.translate.currentLang, { hour: 'numeric', minute: 'numeric' })} h)`
            );
        } else {
            return result;
        }
    }
}
