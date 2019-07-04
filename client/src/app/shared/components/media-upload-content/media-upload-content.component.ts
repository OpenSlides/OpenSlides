import { Component, OnInit, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { MatTableDataSource, MatTable } from '@angular/material/table';

import { FileSystemFileEntry, NgxFileDropEntry } from 'ngx-file-drop';

import { OperatorService } from 'app/core/core-services/operator.service';
import { MediafileRepositoryService } from 'app/core/repositories/mediafiles/mediafile-repository.service';

/**
 * To hold the structure of files to upload
 */
interface FileData {
    mediafile: File;
    filename: string;
    title: string;
    uploader_id: number;
    hidden: boolean;
}

@Component({
    selector: 'os-media-upload-content',
    templateUrl: './media-upload-content.component.html',
    styleUrls: ['./media-upload-content.component.scss']
})
export class MediaUploadContentComponent implements OnInit {
    /**
     * Columns to display in the upload-table
     */
    public displayedColumns: string[] = ['title', 'filename', 'information', 'hidden', 'remove'];

    /**
     * Determine wether to show the progress bar
     */
    public showProgress = false;

    /**
     * Consumable data source for the table
     */
    public uploadList: MatTableDataSource<FileData>;

    /**
     * Holds the IDs of the uploaded files
     */
    private filesUploadedIds: number[] = [];

    /**
     * Determine if uploading should happen parallel or synchronously.
     * Synchronous uploading might be necessary if we see that stuff breaks
     */
    @Input()
    public parallel = true;

    /**
     * Set if an error was detected to prevent automatic navigation
     */
    public errorMessage: string;

    /**
     * Hold the mat table to manually render new rows
     */
    @ViewChild(MatTable, { static: false })
    public table: MatTable<any>;

    /**
     * Emits an event on success
     */
    @Output()
    public uploadSuccessEvent = new EventEmitter<number[]>();

    /**
     * Emits an error event
     */
    @Output()
    public errorEvent = new EventEmitter<string>();

    /**
     * Constructor for the media upload page
     *
     * @param repo the mediafile repository
     * @param op the operator, to check who was the uploader
     */
    public constructor(private repo: MediafileRepositoryService, private op: OperatorService) {}

    /**
     * Init
     * Creates a new uploadList as consumable data source
     */
    public ngOnInit(): void {
        this.uploadList = new MatTableDataSource<FileData>();
    }

    /**
     * Converts given FileData into FormData format and hands it over to the repository
     * to upload
     *
     * @param fileData the file to upload to the server, should fit to the FileData interface
     */
    public async uploadFile(fileData: FileData): Promise<void> {
        const input = new FormData();
        input.set('mediafile', fileData.mediafile);
        input.set('title', fileData.title);
        input.set('uploader_id', '' + fileData.uploader_id);
        input.set('hidden', '' + fileData.hidden);

        // raiseError will automatically ignore existing files
        await this.repo.uploadFile(input).then(
            fileId => {
                this.filesUploadedIds.push(fileId.id);
                // remove the uploaded file from the array
                this.onRemoveButton(fileData);
            },
            error => {
                this.errorMessage = error;
            }
        );
    }

    /**
     * Converts a file size in bit into human readable format
     *
     * @param bits file size in bits
     * @returns a readable file size representation
     */
    public getReadableSize(bits: number): string {
        const unitLevel = Math.floor(Math.log(bits) / Math.log(1024));
        const bytes = +(bits / Math.pow(1024, unitLevel)).toFixed(2);
        return `${bytes} ${['B', 'kB', 'MB', 'GB', 'TB'][unitLevel]}`;
    }

    /**
     * Change event to set a file to hidden or not
     *
     * @param hidden whether the file should be hidden
     * @param file the given file
     */
    public onChangeHidden(hidden: boolean, file: FileData): void {
        file.hidden = hidden;
    }

    /**
     * Change event to adjust the title
     *
     * @param newTitle the new title
     * @param file the given file
     */
    public onChangeTitle(newTitle: string, file: FileData): void {
        file.title = newTitle;
    }

    /**
     * Add a file to list to upload later
     *
     * @param file the file to upload
     */
    public addFile(file: File): void {
        const newFile: FileData = {
            mediafile: file,
            filename: file.name,
            title: file.name,
            uploader_id: this.op.user.id,
            hidden: false
        };
        this.uploadList.data.push(newFile);

        if (this.table) {
            this.table.renderRows();
        }
    }

    /**
     * Handler for the select file event
     *
     * @param $event holds the file. Triggered by changing the file input element
     */
    public onSelectFile(event: any): void {
        if (event.target.files && event.target.files.length > 0) {
            // file list is a special kind of collection, so array.foreach does not apply
            for (const addedFile of event.target.files) {
                this.addFile(addedFile);
            }
        }
    }

    /**
     * Handler for the drop-file event
     *
     * @param event holds the file. Triggered by dropping in the area
     */
    public onDropFile(event: NgxFileDropEntry[]): void {
        for (const droppedFile of event) {
            // Check if the dropped element is a file. "Else" would be a dir.
            if (droppedFile.fileEntry.isFile) {
                const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
                fileEntry.file((file: File) => {
                    this.addFile(file);
                });
            }
        }
    }

    /**
     * Click handler for the upload button.
     * Iterate over the upload list and executes `uploadFile` on each element
     */
    public async onUploadButton(): Promise<void> {
        if (this.uploadList && this.uploadList.data.length > 0) {
            this.errorMessage = '';
            this.showProgress = true;

            if (this.parallel) {
                const promises = this.uploadList.data.map(file => this.uploadFile(file));
                await Promise.all(promises);
            } else {
                for (const file of this.uploadList.data) {
                    await this.uploadFile(file);
                }
            }
            this.showProgress = false;

            if (this.errorMessage === '') {
                this.uploadSuccessEvent.next(this.filesUploadedIds);
            } else {
                this.table.renderRows();
                const filenames = this.uploadList.data.map(file => file.filename);
                this.errorEvent.next(`${this.errorMessage}\n${filenames}`);
            }
        }
    }

    /**
     * Calculate the progress to display in the progress bar
     * Only used in synchronous upload since parallel upload
     *
     * @returns the upload progress in percent.
     */
    public calcUploadProgress(): number {
        if (this.filesUploadedIds && this.filesUploadedIds.length > 0 && this.uploadList.data) {
            return 100 / (this.uploadList.data.length / this.filesUploadedIds.length);
        } else {
            return 0;
        }
    }

    /**
     * Removes the given file from the upload table
     *
     * @param file the file to remove
     */
    public onRemoveButton(file: FileData): void {
        if (this.uploadList.data) {
            this.uploadList.data.splice(this.uploadList.data.indexOf(file), 1);
            this.table.renderRows();
        }
    }

    /**
     * Click handler for the clear button. Deletes the upload list
     */
    public onClearButton(): void {
        this.uploadList.data = [];
        if (this.table) {
            this.table.renderRows();
        }
    }
}
