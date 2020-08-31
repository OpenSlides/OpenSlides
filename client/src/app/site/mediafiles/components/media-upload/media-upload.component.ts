import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';

import { MediafileRepositoryService } from 'app/core/repositories/mediafiles/mediafile-repository.service';
import { BaseViewComponentDirective } from 'app/site/base/base-view';

/**
 * Handle file uploads from user
 */
@Component({
    selector: 'os-media-upload',
    templateUrl: './media-upload.component.html',
    styleUrls: ['./media-upload.component.scss']
})
export class MediaUploadComponent extends BaseViewComponentDirective implements OnInit {
    /**
     * Determine if uploading should happen parallel or synchronously.
     * Synchronous uploading might be necessary if we see that stuff breaks
     */
    public parallel = true;

    public directoryId: number | null = null;

    /**
     * Constructor for the media upload page
     *
     * @param titleService set the browser title
     * @param translate the translation service
     * @param matSnackBar showing errors and information
     * @param router Angulars own router
     * @param route Angulars activated route
     */
    public constructor(
        titleService: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        private location: Location,
        private route: ActivatedRoute,
        private repo: MediafileRepositoryService
    ) {
        super(titleService, translate, matSnackBar);
    }

    public ngOnInit(): void {
        this.repo.getDirectoryIdByPath(this.route.snapshot.url.map(x => x.path)).then(directoryId => {
            this.directoryId = directoryId;
        });
    }

    /**
     * Handler for successful uploads
     */
    public uploadSuccess(): void {
        this.location.back();
    }

    /**
     * Handler for upload errors
     *
     * @param error
     */
    public showError(error: string): void {
        this.raiseError(error);
    }

    /**
     * Changes the upload strategy between synchronous and parallel
     *
     * @param isParallel true or false, whether parallel upload is required or not
     */
    public setUploadStrategy(isParallel: boolean): void {
        this.parallel = isParallel;
    }
}
