import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material';

import { TranslateService } from '@ngx-translate/core';

import { ListViewBaseComponent } from '../../../base/list-view-base';
import { ViewMediafile } from '../../models/view-mediafile';
import { MediafileRepositoryService } from 'app/core/repositories/mediafiles/mediafile-repository.service';
import { MediaManageService } from 'app/core/ui-services/media-manage.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { Mediafile } from 'app/shared/models/mediafiles/mediafile';
import { MediafileFilterListService } from '../../services/mediafile-filter.service';
import { MediafilesSortListService } from '../../services/mediafiles-sort-list.service';
import { ViewportService } from 'app/core/ui-services/viewport.service';
import { OperatorService } from 'app/core/core-services/operator.service';
import { StorageService } from 'app/core/core-services/storage.service';

/**
 * Lists all the uploaded files.
 */
@Component({
    selector: 'os-mediafile-list',
    templateUrl: './mediafile-list.component.html',
    styleUrls: ['./mediafile-list.component.scss']
})
export class MediafileListComponent extends ListViewBaseComponent<ViewMediafile, Mediafile> implements OnInit {
    /**
     * Holds the actions for logos. Updated via an observable
     */
    public logoActions: string[];

    /**
     * Holds the actions for fonts. Update via an observable
     */
    public fontActions: string[];

    /**
     * Columns to display in Mediafile table when desktop view is available
     */
    public displayedColumnsDesktop: string[] = ['title', 'info', 'indicator', 'menu'];

    /**
     * Columns to display in Mediafile table when mobile view is available
     */
    public displayedColumnsMobile: string[] = ['title', 'menu'];

    /**
     * Show or hide the edit mode
     */
    public editFile = false;

    /**
     * Holds the file to edit
     */
    public fileToEdit: ViewMediafile;

    /**
     * @returns true if the user can manage media files
     */
    public get canEdit(): boolean {
        return this.operator.hasPerms('mediafiles.can_manage');
    }

    /**
     * The form to edit Files
     */
    @ViewChild('fileEditForm')
    public fileEditForm: FormGroup;

    /**
     * Constructs the component
     *
     * @param titleService sets the browser title
     * @param translate translation for the parent
     * @param matSnackBar showing errors and sucsess messages
     * @param router angulars router
     * @param route anduglars ActivatedRoute
     * @param repo the repository for mediafiles
     * @param mediaManage service to manage media files (setting images as logos)
     * @param promptService prevent deletion by accident
     * @param vp viewport Service to check screen size
     * @param fitlerService MediaFileFilterService for advanced filtering
     * @param sortService MediaFileSortService sort for advanced sorting
     * @param operator permission check
     */
    public constructor(
        titleService: Title,
        protected translate: TranslateService,
        matSnackBar: MatSnackBar,
        route: ActivatedRoute,
        storage: StorageService,
        private router: Router,
        private repo: MediafileRepositoryService,
        private mediaManage: MediaManageService,
        private promptService: PromptService,
        public vp: ViewportService,
        public filterService: MediafileFilterListService,
        public sortService: MediafilesSortListService,
        private operator: OperatorService
    ) {
        super(titleService, translate, matSnackBar, route, storage, filterService, sortService);

        // enables multiSelection for this listView
        this.canMultiSelect = true;
    }

    /**
     * Init.
     * Set the title, make the edit Form and observe Mediafiles
     */
    public ngOnInit(): void {
        super.setTitle('Files');
        this.initTable();

        this.fileEditForm = new FormGroup({
            title: new FormControl('', Validators.required),
            hidden: new FormControl()
        });

        // Observe the logo actions
        this.mediaManage.getLogoActions().subscribe(action => {
            this.logoActions = action;
        });

        // Observe the font actions
        this.mediaManage.getFontActions().subscribe(action => {
            this.fontActions = action;
        });
        this.setFulltextFilter();
    }

    /**
     * Handler for the main Event.
     * In edit mode, this abandons the changes
     * Without edit mode, this will navigate to the upload page
     */
    public onMainEvent(): void {
        if (!this.editFile) {
            this.router.navigate(['./upload'], { relativeTo: this.route });
        } else {
            this.editFile = false;
        }
    }

    /**
     * Click on the edit button in the file menu
     *
     * @param file the selected file
     */
    public onEditFile(file: ViewMediafile): void {
        this.fileToEdit = file;

        this.editFile = true;
        this.fileEditForm.setValue({ title: this.fileToEdit.title, hidden: this.fileToEdit.hidden });
    }

    /**
     * Click on the save button in edit mode
     */
    public onSaveEditedFile(): void {
        if (!this.fileEditForm.value || !this.fileEditForm.valid) {
            return;
        }
        const updateData = new Mediafile({
            title: this.fileEditForm.value.title,
            hidden: this.fileEditForm.value.hidden
        });

        this.repo.update(updateData, this.fileToEdit).then(() => {
            this.editFile = false;
        }, this.raiseError);
    }

    /**
     * Sends a delete request to the repository.
     *
     * @param file the file to delete
     */
    public async onDelete(file: ViewMediafile): Promise<void> {
        const title = this.translate.instant('Are you sure you want to delete this file?');
        const content = file.getTitle();
        if (await this.promptService.open(title, content)) {
            this.repo.delete(file);
        }
    }

    /**
     * Handler to delete several files at once. Requires data in selectedRows, which
     * will be made available in multiSelect mode
     */
    public async deleteSelected(): Promise<void> {
        const title = this.translate.instant('Are you sure you want to delete all selected files?');
        if (await this.promptService.open(title, null)) {
            for (const mediafile of this.selectedRows) {
                await this.repo.delete(mediafile);
            }
        }
    }

    /**
     * Returns the display name of an action
     *
     * @param mediaFileAction Logo or font action
     * @returns the display name of the selected action
     */
    public getNameOfAction(mediaFileAction: string): string {
        return this.translate.instant(this.mediaManage.getMediaConfig(mediaFileAction).display_name);
    }

    /**
     * Returns a formated string for the tooltip containing all the action names.
     *
     * @param file the target file where the tooltip should be shown
     * @returns getNameOfAction with formated strings.
     */
    public formatIndicatorTooltip(file: ViewMediafile): string {
        const settings = this.getFileSettings(file);
        const actionNames = settings.map(option => this.getNameOfAction(option));
        return actionNames.join('\n');
    }

    /**
     * Checks if the given file is used in the following action
     * i.e checks if a image is used as projector logo
     *
     * @param mediaFileAction the action to check for
     * @param media the mediafile to check
     * @returns whether the file is used
     */
    public isUsedAs(file: ViewMediafile, mediaFileAction: string): boolean {
        const config = this.mediaManage.getMediaConfig(mediaFileAction);
        return config.path === file.downloadUrl;
    }

    /**
     * Look up the managed options for the given file
     *
     * @param file the file to look up
     * @returns array of actions
     */
    public getFileSettings(file: ViewMediafile): string[] {
        let uses = [];
        if (file) {
            if (file.isFont()) {
                uses = this.fontActions.filter(action => this.isUsedAs(file, action));
            } else if (file.isImage()) {
                uses = this.logoActions.filter(action => this.isUsedAs(file, action));
            }
        }
        return uses;
    }

    /**
     * Set the given image as the given option
     *
     * @param event The fired event after clicking the button
     * @param file the selected file
     * @param action the action that should be executed
     */
    public onManageButton(event: any, file: ViewMediafile, action: string): void {
        // prohibits automatic closing
        event.stopPropagation();
        this.mediaManage.setAs(file, action);
    }

    /**
     * Uses the ViewportService to determine which column definition to use
     *
     * @returns the column definition for the screen size
     */
    public getColumnDefinition(): string[] {
        let columns = this.vp.isMobile ? this.displayedColumnsMobile : this.displayedColumnsDesktop;
        if (this.operator.hasPerms('core.can_manage_projector') && !this.isMultiSelect) {
            columns = ['projector'].concat(columns);
        }
        if (this.isMultiSelect) {
            columns = ['selector'].concat(columns);
        }
        return columns;
    }

    /**
     * Directly downloads a mediafile
     *
     * @param file the select file to download
     */
    public singleSelectAction(file: ViewMediafile): void {
        window.open(file.downloadUrl);
    }

    /**
     * Clicking escape while in editFileForm should deactivate edit mode.
     *
     * @param event The key that was pressed
     */
    public keyDownFunction(event: KeyboardEvent): void {
        if (event.key === 'Escape') {
            this.editFile = false;
        }
    }

    /**
     * Overwrites the dataSource's string filter with a case-insensitive search
     * in the file name property
     */
    private setFulltextFilter(): void {
        this.dataSource.filterPredicate = (data, filter) => {
            if (!data || !data.title) {
                return false;
            }
            filter = filter ? filter.toLowerCase() : '';
            return data.title.toLowerCase().indexOf(filter) >= 0;
        };
    }
}
