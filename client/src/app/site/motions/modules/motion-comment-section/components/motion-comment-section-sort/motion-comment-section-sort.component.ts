import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { MotionCommentSectionRepositoryService } from 'app/core/repositories/motions/motion-comment-section-repository.service';
import { BaseViewComponent } from 'app/site/base/base-view';
import { ViewMotionCommentSection } from 'app/site/motions/models/view-motion-comment-section';

/**
 * Sorting view for motion comments
 */
@Component({
    selector: 'os-motion-comment-section-sort',
    templateUrl: './motion-comment-section-sort.component.html',
    styleUrls: ['./motion-comment-section-sort.component.scss']
})
export class MotionCommentSectionSortComponent extends BaseViewComponent implements OnInit {
    /**
     * Holds the models
     */
    public comments: ViewMotionCommentSection[];

    /**
     * Constructor
     *
     * @param title Title service
     * @param translate Translate service
     * @param snackBar Snack bar
     * @param repo Motion comment repository service
     */
    public constructor(
        title: Title,
        translate: TranslateService, // protected required for ng-translate-extract
        snackBar: MatSnackBar,
        private repo: MotionCommentSectionRepositoryService
    ) {
        super(title, translate, snackBar);
        super.setTitle('Sort comments');
    }

    /**
     * Get the view models from the repo
     */
    public ngOnInit(): void {
        this.repo.getViewModelListObservable().subscribe(comments => (this.comments = comments));
    }

    /**
     * Executed if the sorting changes
     *
     * @param commentsInOrder
     */
    public onSortingChange(commentsInOrder: ViewMotionCommentSection[]): void {
        this.repo.sortCommentSections(commentsInOrder).catch(this.raiseError);
    }
}
