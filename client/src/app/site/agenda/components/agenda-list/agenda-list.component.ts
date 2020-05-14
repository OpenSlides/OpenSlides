import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';

import { marker as _ } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateService } from '@ngx-translate/core';
import { PblColumnDefinition } from '@pebula/ngrid';

import { AgendaCsvExportService } from '../../services/agenda-csv-export.service';
import { AgendaFilterListService } from '../../services/agenda-filter-list.service';
import { AgendaPdfService } from '../../services/agenda-pdf.service';
import { OperatorService, Permission } from 'app/core/core-services/operator.service';
import { StorageService } from 'app/core/core-services/storage.service';
import { PdfDocumentService } from 'app/core/pdf-services/pdf-document.service';
import { ItemRepositoryService } from 'app/core/repositories/agenda/item-repository.service';
import { ListOfSpeakersRepositoryService } from 'app/core/repositories/agenda/list-of-speakers-repository.service';
import { TopicRepositoryService } from 'app/core/repositories/topics/topic-repository.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { DurationService } from 'app/core/ui-services/duration.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { ViewportService } from 'app/core/ui-services/viewport.service';
import { ColumnRestriction } from 'app/shared/components/list-view-table/list-view-table.component';
import { infoDialogSettings } from 'app/shared/utils/dialog-settings';
import { BaseListViewComponent } from 'app/site/base/base-list-view';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import { ViewTopic } from 'app/site/topics/models/view-topic';
import { ItemInfoDialogComponent } from '../item-info-dialog/item-info-dialog.component';
import { ViewItem } from '../../models/view-item';
import { ViewListOfSpeakers } from '../../models/view-list-of-speakers';

/**
 * List view for the agenda.
 */
@Component({
    selector: 'os-agenda-list',
    templateUrl: './agenda-list.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrls: ['./agenda-list.component.scss']
})
export class AgendaListComponent extends BaseListViewComponent<ViewItem> implements OnInit {
    /**
     * Show or hide the numbering button
     */
    public isNumberingAllowed: boolean;

    /**
     * A boolean, that decides, if the optional subtitles should be shown.
     */
    public showSubtitle: boolean;

    /**
     * Helper to check main button permissions
     *
     * @returns true if the operator can manage agenda items
     */
    public get canManage(): boolean {
        return this.operator.hasPerms(Permission.agendaCanManage);
    }

    public itemListSlide: ProjectorElementBuildDeskriptor = {
        getBasicProjectorElement: options => ({
            name: 'agenda/item-list',
            getIdentifiers: () => ['name']
        }),
        slideOptions: [
            {
                key: 'only_main_items',
                displayName: _('Only main agenda items'),
                default: false
            }
        ],
        projectionDefaultName: 'agenda_all_items',
        getDialogTitle: () => this.translate.instant('Agenda')
    };

    /**
     * Define the columns to show
     */
    public tableColumnDefinition: PblColumnDefinition[] = [
        {
            prop: 'title',
            width: 'auto'
        },
        {
            prop: 'info',
            width: '15%'
        }
    ];

    public restrictedColumns: ColumnRestriction[] = [
        {
            columnName: 'menu',
            permission: Permission.agendaCanManage
        }
    ];

    /**
     * Define extra filter properties
     */
    public filterProps = ['item_number', 'comment', 'getListTitle'];

    /**
     * The usual constructor for components
     * @param titleService Setting the browser tab title
     * @param translate translations
     * @param matSnackBar Shows errors and messages
     * @param operator The current user
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
        protected translate: TranslateService, // protected required for ng-translate-extract
        matSnackBar: MatSnackBar,
        storage: StorageService,
        private operator: OperatorService,
        private router: Router,
        public repo: ItemRepositoryService,
        private promptService: PromptService,
        private dialog: MatDialog,
        private config: ConfigService,
        public vp: ViewportService,
        public durationService: DurationService,
        private csvExport: AgendaCsvExportService,
        public filterService: AgendaFilterListService,
        private agendaPdfService: AgendaPdfService,
        private pdfService: PdfDocumentService,
        private listOfSpeakersRepo: ListOfSpeakersRepositoryService,
        private topicRepo: TopicRepositoryService
    ) {
        super(titleService, translate, matSnackBar, storage);
        this.canMultiSelect = true;
    }

    /**
     * Init function.
     * Sets the title, initializes the table and filter options, subscribes to filter service.
     */
    public ngOnInit(): void {
        super.setTitle('Agenda');
        this.config
            .get<boolean>('agenda_enable_numbering')
            .subscribe(autoNumbering => (this.isNumberingAllowed = autoNumbering));
        this.config.get<boolean>('agenda_show_subtitle').subscribe(showSubtitle => (this.showSubtitle = showSubtitle));
    }

    /**
     * Gets the list of speakers for an agenda item. Might be null, if the items content
     * object does not have a list of speakers.
     *
     * @param item The item to get the list of speakers from
     */
    public getListOfSpeakers(item: ViewItem): ViewListOfSpeakers | null {
        return this.listOfSpeakersRepo.findByContentObject(item.item.content_object);
    }

    /**
     * Links to the content object.
     *
     * @param item the item that was selected from the list view
     */
    public getDetailUrl(item: ViewItem): string {
        if (item.contentObject && !this.isMultiSelect) {
            return item.contentObject.getDetailStateURL();
        }
    }

    /**
     * Opens the item-info-dialog.
     * Enable direct changing of various information
     *
     * @param item The view item that was clicked
     */
    public openEditInfo(item: ViewItem): void {
        if (this.isMultiSelect || !this.canManage) {
            return;
        }
        const dialogRef = this.dialog.open(ItemInfoDialogComponent, { ...infoDialogSettings, data: item });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                if (result.durationText) {
                    result.duration = this.durationService.stringToDuration(result.durationText);
                } else {
                    result.duration = 0;
                }
                this.repo.update(result, item).catch(this.raiseError);
            }
        });
    }

    /**
     * Click handler for the numbering button to enable auto numbering
     */
    public async onAutoNumbering(): Promise<void> {
        const title = this.translate.instant('Are you sure you want to number all agenda items?');
        if (await this.promptService.open(title)) {
            await this.repo.autoNumbering().catch(this.raiseError);
        }
    }

    /**
     * Click handler for the done button in the dot-menu
     */
    public async onDoneSingleButton(item: ViewItem): Promise<void> {
        await this.repo.update({ closed: !item.closed }, item).catch(this.raiseError);
    }

    /**
     * Handler for the plus button.
     * Comes from the HeadBar Component
     */
    public onPlusButton(): void {
        this.router.navigate(['/topics/new']);
    }

    /**
     * Remove handler for a single item
     *
     * @param item The item to remove from the agenda
     */
    public async removeFromAgenda(item: ViewItem): Promise<void> {
        const title = this.translate.instant('Are you sure you want to remove this entry from the agenda?');
        const content = item.contentObject.getTitle();
        if (await this.promptService.open(title, content)) {
            await this.repo.removeFromAgenda(item).catch(this.raiseError);
        }
    }

    public async deleteTopic(item: ViewItem): Promise<void> {
        if (!(item.contentObject instanceof ViewTopic)) {
            return;
        }
        const title = this.translate.instant('Are you sure you want to delete this topic?');
        const content = item.contentObject.getTitle();
        if (await this.promptService.open(title, content)) {
            await this.topicRepo.delete(item.contentObject).catch(this.raiseError);
        }
    }

    /**
     * Handler for deleting multiple entries. Needs items in selectedRows, which
     * is only filled with any data in multiSelect mode
     */
    public async removeSelected(): Promise<void> {
        const title = this.translate.instant('Are you sure you want to remove all selected items from the agenda?');
        const content = this.translate.instant("All topics will be deleted and won't be accessible afterwards.");
        if (await this.promptService.open(title, content)) {
            try {
                for (const item of this.selectedRows) {
                    if (item.contentObject instanceof ViewTopic) {
                        await this.topicRepo.delete(item.contentObject);
                    } else {
                        await this.repo.removeFromAgenda(item);
                    }
                }
            } catch (e) {
                this.raiseError(e);
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
        try {
            for (const item of this.selectedRows) {
                await this.repo.update({ closed: closed }, item);
            }
        } catch (e) {
            this.raiseError(e);
        }
    }

    /**
     * Sets multiple entries' agenda type. Needs items in selectedRows, which
     * is only filled with any data in multiSelect mode.
     *
     * @param visible true if the item is to be shown
     */
    public async setAgendaType(agendaType: number): Promise<void> {
        try {
            for (const item of this.selectedRows) {
                await this.repo.update({ type: agendaType }, item).catch(this.raiseError);
            }
        } catch (e) {
            this.raiseError(e);
        }
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
        const durationString = this.durationService.durationToString(duration, 'h');
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

    public async deleteAllSpeakersOfAllListsOfSpeakers(): Promise<void> {
        const title = this.translate.instant('Are you sure you want to clear all speakers of all lists?');
        const content = this.translate.instant('All lists of speakers will be cleared.');
        if (await this.promptService.open(title, content)) {
            this.listOfSpeakersRepo.deleteAllSpeakersOfAllListsOfSpeakers().catch(this.raiseError);
        }
    }

    /**
     * Duplicates a single selected item.
     *
     * @param item The item to duplicte.
     */
    public duplicateTopic(topic: ViewTopic): void {
        this.topicRepo.duplicateTopic(topic);
    }

    /**
     * Duplicates all selected items, that are topics.
     *
     * @param selectedItems All selected items.
     */
    public duplicateMultipleTopics(selectedItems: ViewItem[]): void {
        for (const item of selectedItems) {
            if (this.isTopic(item.contentObject)) {
                this.duplicateTopic(item.contentObject);
            }
        }
    }

    /**
     * Helper function to determine, if the given item is a `Topic`.
     *
     * @param item The selected item.
     *
     * @returns `true` if the given item's collection is equal to the `Topic.COLLECTIONSTRING`.
     */
    public isTopic(obj: any): obj is ViewTopic {
        const topic = obj as ViewTopic;
        return (
            !!topic &&
            topic.collectionString !== undefined &&
            topic.collectionString === ViewTopic.COLLECTIONSTRING &&
            !!topic.topic
        );
    }
}
