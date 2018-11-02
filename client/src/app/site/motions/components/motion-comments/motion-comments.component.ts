import { Component, Input } from '@angular/core';

import { BaseComponent } from '../../../../base.component';
import { ViewportService } from '../../../../core/services/viewport.service';
import { MotionCommentSectionRepositoryService } from '../../services/motion-comment-section-repository.service';
import { ViewMotionCommentSection } from '../../models/view-motion-comment-section';
import { OperatorService } from '../../../../core/services/operator.service';
import { FormGroup, FormBuilder } from '@angular/forms';
import { MotionComment } from '../../../../shared/models/motions/motion-comment';
import { ViewMotion } from '../../models/view-motion';
import { HttpService } from '../../../../core/services/http.service';

/**
 * Component for the motion comments view
 */
@Component({
    selector: 'os-motion-comments',
    templateUrl: './motion-comments.component.html',
    styleUrls: ['./motion-comments.component.scss']
})
export class MotionCommentsComponent extends BaseComponent {
    /**
     * An array of all sections the operator can see.
     */
    public sections: ViewMotionCommentSection[] = [];

    /**
     * An object of forms for one comment mapped to the section id.
     */
    public commentForms: { [id: number]: FormGroup } = {};

    /**
     * This object holds all comments for each section for the given motion.
     */
    public comments: { [id: number]: MotionComment } = {};

    /**
     * The motion, which these comments belong to.
     */
    private _motion: ViewMotion;

    @Input()
    public set motion(motion: ViewMotion) {
        this._motion = motion;
        this.updateComments();
    }

    public get motion(): ViewMotion {
        return this._motion;
    }

    /**
     * Watches for changes in sections and the operator. If one of them changes, the sections are reloaded
     * and the comments updated.
     */
    public constructor(
        private commentRepo: MotionCommentSectionRepositoryService,
        private http: HttpService,
        private formBuilder: FormBuilder,
        public vp: ViewportService,
        private operator: OperatorService
    ) {
        super();

        this.commentRepo.getViewModelListObservable().subscribe(sections => this.setSections(sections));
        this.operator.getObservable().subscribe(() => this.setSections(this.commentRepo.getViewModelList()));
    }

    /**
     * sets the `sections` member with sections, if the operator has reading permissions.
     * @param allSections A list of all sections available
     */
    private setSections(allSections: ViewMotionCommentSection[]): void {
        this.sections = allSections.filter(section => this.operator.isInGroupIds(...section.read_groups_id));
        this.updateComments();
    }

    /**
     * Returns true if the operator has write permissions for the given section, so he can edit the comment.
     * @param section The section to judge about
     */
    public canEditSection(section: ViewMotionCommentSection): boolean {
        return this.operator.isInGroupIds(...section.write_groups_id);
    }

    /**
     * Update the comments. Comments are saved in the `comments` object associated with their section id.
     */
    private updateComments(): void {
        this.comments = {};
        if (!this.motion || !this.sections) {
            return;
        }
        this.sections.forEach(section => {
            this.comments[section.id] = this.motion.getCommentForSection(section);
        });
    }

    /**
     * Puts the comment into edit mode.
     * @param section The section for the comment.
     */
    public editComment(section: ViewMotionCommentSection): void {
        const comment = this.comments[section.id];
        const form = this.formBuilder.group({
            comment: [comment ? comment.comment : '']
        });
        this.commentForms[section.id] = form;
    }

    /**
     * Saves the comment. Makes a request to the server.
     * @param section The section for the comment to save
     */
    public async saveComment(section: ViewMotionCommentSection): Promise<void> {
        const commentText = this.commentForms[section.id].get('comment').value;
        try {
            await this.http
                .post(`rest/motions/motion/${this.motion.id}/manage_comments/`, {
                    section_id: section.id,
                    comment: commentText
                });
            this.cancelEditing(section);
        } catch (e) {
            console.log(e);
            // TODO: Errorhandling
        }
    }

    /**
     * Cancles the editing for a comment.
     * @param section The section for the comment
     */
    public cancelEditing(section: ViewMotionCommentSection): void {
        delete this.commentForms[section.id];
    }

    /**
     * Returns true, if the comment is edited.
     * @param section The section for the comment.
     */
    public isCommentEdited(section: ViewMotionCommentSection): boolean {
        return Object.keys(this.commentForms).includes('' + section.id);
    }
}
