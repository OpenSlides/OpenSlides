import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
    TemplateRef,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';
import { columnFactory, createDS, PblColumnDefinition } from '@pebula/ngrid';
import { PblNgridDataMatrixRow } from '@pebula/ngrid/target-events';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';

import { OperatorService, Permission } from 'app/core/core-services/operator.service';
import { StorageService } from 'app/core/core-services/storage.service';
import { MediafileRepositoryService } from 'app/core/repositories/mediafiles/mediafile-repository.service';
import { GroupRepositoryService } from 'app/core/repositories/users/group-repository.service';
import { MediaManageService } from 'app/core/ui-services/media-manage.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { ViewportService } from 'app/core/ui-services/viewport.service';
import { Mediafile } from 'app/shared/models/mediafiles/mediafile';
import { infoDialogSettings } from 'app/shared/utils/dialog-settings';
import { BaseListViewComponent } from 'app/site/base/base-list-view';
import { ViewMediafile } from 'app/site/mediafiles/models/view-mediafile';
import { ViewGroup } from 'app/site/users/models/view-group';
import { MediafilesSortListService } from '../../services/mediafiles-sort-list.service';

/**
 * Lists all the uploaded files.
 */
@Component({
    selector: 'os-mediafile-list',
    templateUrl: './mediafile-list.component.html',
    styleUrls: ['./mediafile-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class MediafileListComponent extends BaseListViewComponent<ViewMediafile> implements OnInit, OnDestroy {
    /**
     * Holds the actions for logos. Updated via an observable
     */
    public logoActions: string[];

    /**
     * Holds the actions for fonts. Update via an observable
     */
    public fontActions: string[];

    /**
     * Holds the file to edit
     */
    public fileToEdit: ViewMediafile;

    public newDirectoryForm: FormGroup;
    public moveForm: FormGroup;
    public directoryBehaviorSubject: BehaviorSubject<ViewMediafile[]>;
    public filteredDirectoryBehaviorSubject: BehaviorSubject<ViewMediafile[]> = new BehaviorSubject<ViewMediafile[]>(
        []
    );
    public groupsBehaviorSubject: BehaviorSubject<ViewGroup[]>;

    /**
     * @return true if the user can manage media files
     */
    public get canEdit(): boolean {
        return this.operator.hasPerms(Permission.mediafilesCanManage);
    }

    /**
     * Determine if the file menu should generally be accessible, according to the users permission
     */
    public get canAccessFileMenu(): boolean {
        return (
            this.operator.hasPerms(Permission.coreCanManageProjector) ||
            this.operator.hasPerms(Permission.agendaCanSeeListOfSpeakers) ||
            this.operator.hasPerms(Permission.coreCanManageLogosAndFonts) ||
            this.canEdit
        );
    }

    /**
     * The form to edit Files
     */
    @ViewChild('fileEditForm', { static: true })
    public fileEditForm: FormGroup;

    /**
     * Reference to the template
     */
    @ViewChild('fileEditDialog', { static: true })
    public fileEditDialog: TemplateRef<string>;

    /**
     * Determine generally hidden columns
     */
    public get hiddenColumns(): string[] {
        const hidden = [];
        if (!this.canEdit) {
            hidden.push('info');
        }

        if (!this.isMultiSelect) {
            hidden.push('selection');
        }

        if (!this.canAccessFileMenu) {
            hidden.push('menu');
        }

        return hidden;
    }

    /**
     * Define the column definition
     */
    public tableColumnDefinition: PblColumnDefinition[] = [
        {
            prop: 'selection',
            width: '40px'
        },
        {
            prop: 'icon',
            label: '',
            width: '40px'
        },
        {
            prop: 'title',
            width: 'auto',
            minWidth: 60
        },
        {
            prop: 'info',
            width: '20%',
            minWidth: 60
        },
        {
            prop: 'indicator',
            label: '',
            width: '40px'
        },
        {
            prop: 'menu',
            label: '',
            width: '40px'
        }
    ];

    /**
     * Create the column set
     */
    public columnSet = columnFactory()
        .table(...this.tableColumnDefinition)
        .build();

    private folderSubscription: Subscription;
    private directorySubscription: Subscription;
    public directory: ViewMediafile | null;
    public directoryChain: ViewMediafile[];

    private directoryObservable: Observable<ViewMediafile[]> = new Observable();

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
        storage: StorageService,
        private route: ActivatedRoute,
        private router: Router,
        public repo: MediafileRepositoryService,
        private mediaManage: MediaManageService,
        private promptService: PromptService,
        public vp: ViewportService,
        public sortService: MediafilesSortListService,
        private operator: OperatorService,
        private dialog: MatDialog,
        private fb: FormBuilder,
        private formBuilder: FormBuilder,
        private groupRepo: GroupRepositoryService,
        private cd: ChangeDetectorRef
    ) {
        super(titleService, translate, matSnackBar, storage);
        this.canMultiSelect = true;

        this.newDirectoryForm = this.formBuilder.group({
            title: ['', Validators.required],
            access_groups_id: []
        });
        this.moveForm = this.formBuilder.group({
            directory_id: []
        });
        this.directoryBehaviorSubject = this.repo.getDirectoryBehaviorSubject();
        this.groupsBehaviorSubject = this.groupRepo.getViewModelListBehaviorSubject();
    }

    /**
     * Init.
     * Set the title, make the edit Form and observe Mediafiles
     */
    public ngOnInit(): void {
        super.setTitle('Files');

        this.repo.getDirectoryIdByPath(this.route.snapshot.url.map(x => x.path)).then(directoryId => {
            this.changeDirectory(directoryId);
        });

        // Observe the logo actions
        this.mediaManage.getLogoActions().subscribe(action => {
            this.logoActions = action;
        });

        // Observe the font actions
        this.mediaManage.getFontActions().subscribe(action => {
            this.fontActions = action;
        });

        this.createDataSource();
    }

    public ngOnDestroy(): void {
        super.ngOnDestroy();
        this.clearSubscriptions();
        this.cd.detach();
    }

    /**
     * Determine if the given file has any extra option to show.
     * @param file the file to check
     * @returns wether the extra menu should be accessible
     */
    public showFileMenu(file: ViewMediafile): boolean {
        return (
            this.operator.hasPerms(Permission.agendaCanSeeListOfSpeakers) ||
            (file.isProjectable() && this.operator.hasPerms(Permission.coreCanManageProjector)) ||
            (file.isFont() && this.operator.hasPerms(Permission.coreCanManageLogosAndFonts)) ||
            (file.isImage() && this.operator.hasPerms(Permission.coreCanManageLogosAndFonts)) ||
            this.canEdit
        );
    }

    public getDateFromTimestamp(timestamp: string): string {
        return new Date(timestamp).toLocaleString(this.translate.currentLang);
    }

    /**
     * TODO: Swap logic to only create DS once and update on filder change
     * @param mediafiles
     */
    private createDataSource(): void {
        this.dataSource = createDS<ViewMediafile>()
            .onTrigger(() => this.directoryObservable)
            .create();

        this.dataSource.selection.changed.subscribe(selection => {
            this.selectedRows = selection.source.selected;
        });
    }

    public changeDirectory(directoryId: number | null): void {
        this.clearSubscriptions();

        this.directoryObservable = this.repo.getListObservableDirectory(directoryId);
        this.folderSubscription = this.directoryObservable.subscribe(mediafiles => {
            if (mediafiles) {
                this.dataSource.refresh();
                this.cd.markForCheck();
            }
        });

        if (directoryId) {
            this.directorySubscription = this.repo.getViewModelObservable(directoryId).subscribe(newDirectory => {
                this.directory = newDirectory;
                if (newDirectory) {
                    this.directoryChain = newDirectory.getDirectoryChain();
                    // Update the URL.
                    this.router.navigate(['/mediafiles/files/' + newDirectory.path], {
                        replaceUrl: true
                    });
                } else {
                    this.directoryChain = [];
                    this.router.navigate(['/mediafiles/files/'], {
                        replaceUrl: true
                    });
                }
            });
        } else {
            this.directory = null;
            this.directoryChain = [];
            this.router.navigate(['/mediafiles/files/'], {
                replaceUrl: true
            });
        }
    }

    public onMainEvent(): void {
        const path = '/mediafiles/upload/' + (this.directory ? this.directory.path : '');
        this.router.navigate([path]);
    }

    /**
     * Click on the edit button in the file menu
     *
     * @param file the selected file
     */
    public onEditFile(file: ViewMediafile): void {
        if (!this.isMultiSelect) {
            this.fileToEdit = file;

            this.fileEditForm = this.fb.group({
                title: [file.filename, Validators.required],
                access_groups_id: [file.access_groups_id]
            });

            const dialogRef = this.dialog.open(this.fileEditDialog, infoDialogSettings);

            dialogRef.keydownEvents().subscribe((event: KeyboardEvent) => {
                if (event.key === 'Enter' && event.shiftKey && this.fileEditForm.valid) {
                    this.onSaveEditedFile(this.fileEditForm.value);
                }
            });
        }
    }

    /**
     * Click on the save button in edit mode
     */
    public onSaveEditedFile(value: Partial<Mediafile>): void {
        this.repo.update(value, this.fileToEdit).then(() => {
            this.dialog.closeAll();
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

    public async deleteSelected(): Promise<void> {
        const title = this.translate.instant('Are you sure you want to delete all selected files and folders?');
        if (await this.promptService.open(title)) {
            await this.repo.bulkDelete(this.selectedRows);
            this.deselectAll();
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
        return config ? config.path === file.url : false;
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
        this.mediaManage.setAs(file, action).then(() => {
            this.cd.markForCheck();
        });
    }

    public createNewFolder(templateRef: TemplateRef<string>): void {
        this.newDirectoryForm.reset();
        const dialogRef = this.dialog.open(templateRef, infoDialogSettings);

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                const mediafile = new Mediafile({
                    ...this.newDirectoryForm.value,
                    parent_id: this.directory ? this.directory.id : null,
                    is_directory: true
                });
                this.repo.create(mediafile).catch(this.raiseError);
            }
        });
    }

    public move(templateRef: TemplateRef<string>, mediafiles: ViewMediafile[]): void {
        this.moveForm.reset();

        if (mediafiles.some(file => file.is_directory)) {
            this.filteredDirectoryBehaviorSubject.next(
                this.directoryBehaviorSubject.value.filter(
                    dir => !mediafiles.some(file => dir.path.startsWith(file.path))
                )
            );
        } else {
            this.filteredDirectoryBehaviorSubject.next(this.directoryBehaviorSubject.value);
        }
        const dialogRef = this.dialog.open(templateRef, infoDialogSettings);

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.repo.move(mediafiles, this.moveForm.value.directory_id).then(() => {
                    this.dataSource.selection.clear();
                    this.cd.markForCheck();
                }, this.raiseError);
            }
        });
    }

    /**
     * TODO: This is basically a duplicate of onSelectRow of ListViewTableComponent
     */
    public onSelectRow(event: PblNgridDataMatrixRow<ViewMediafile>): void {
        if (this.isMultiSelect) {
            const clickedModel: ViewMediafile = event.row;
            const alreadySelected = this.dataSource.selection.isSelected(clickedModel);
            if (alreadySelected) {
                this.dataSource.selection.deselect(clickedModel);
            } else {
                this.dataSource.selection.select(clickedModel);
            }
        }
    }

    private clearSubscriptions(): void {
        if (this.folderSubscription) {
            this.folderSubscription.unsubscribe();
            this.folderSubscription = null;
        }
        if (this.directorySubscription) {
            this.directorySubscription.unsubscribe();
            this.directorySubscription = null;
        }
    }
}
