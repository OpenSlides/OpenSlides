import { Injectable } from '@angular/core';
import { DataSendService } from '../../../core/services/data-send.service';
import { DataStoreService } from '../../../core/services/data-store.service';
import { BaseRepository } from '../../base/base-repository';
import { ViewMotionCommentSection } from '../models/view-motion-comment-section';
import { MotionCommentSection } from '../../../shared/models/motions/motion-comment-section';
import { Group } from '../../../shared/models/users/group';
import { Identifiable } from '../../../shared/models/base/identifiable';
import { CollectionStringModelMapperService } from '../../../core/services/collectionStringModelMapper.service';
import { HttpService } from 'app/core/services/http.service';

/**
 * Repository Services for Categories
 *
 * The repository is meant to process domain objects (those found under
 * shared/models), so components can display them and interact with them.
 *
 * Rather than manipulating models directly, the repository is meant to
 * inform the {@link DataSendService} about changes which will send
 * them to the Server.
 */
@Injectable({
    providedIn: 'root'
})
export class MotionCommentSectionRepositoryService extends BaseRepository<
    ViewMotionCommentSection,
    MotionCommentSection
> {
    /**
     * Creates a CategoryRepository
     * Converts existing and incoming category to ViewCategories
     * Handles CRUD using an observer to the DataStore
     *
     * @param mapperService Mapper Service for the Collection Strings
     * @param DS Service that handles the dataStore
     * @param dataSend Service to handle the dataSending
     * @param http Service to handle direct http-communication
     */
    public constructor(
        mapperService: CollectionStringModelMapperService,
        protected DS: DataStoreService,
        private dataSend: DataSendService,
        private http: HttpService
    ) {
        super(DS, mapperService, MotionCommentSection, [Group]);
    }

    /**
     * Creates the ViewModel for the MotionComment Section
     *
     * @param section the MotionCommentSection the View Model should be created of
     * @returns the View Model representation of the MotionCommentSection
     */
    protected createViewModel(section: MotionCommentSection): ViewMotionCommentSection {
        const read_groups = this.DS.getMany(Group, section.read_groups_id);
        const write_groups = this.DS.getMany(Group, section.write_groups_id);
        return new ViewMotionCommentSection(section, read_groups, write_groups);
    }

    /**
     * Creates the Comment Section
     *
     * @param section section to be created
     * @returns the promise to create the comment section
     */
    public async create(section: MotionCommentSection): Promise<Identifiable> {
        return await this.dataSend.createModel(section);
    }

    /**
     * Updates an existion CommentSection
     *
     * @param section the update that the section should be created on
     * @param viewSection the view model representation of that section
     */
    public async update(section: Partial<MotionCommentSection>, viewSection?: ViewMotionCommentSection): Promise<void> {
        let updateSection: MotionCommentSection;
        if (viewSection) {
            updateSection = viewSection.section;
        } else {
            updateSection = new MotionCommentSection();
        }
        updateSection.patchValues(section);
        await this.dataSend.updateModel(updateSection);
    }

    /**
     * Deletes a MotionCommentSection
     *
     * @param viewSection the view model representation of the model that should be deleted
     */
    public async delete(viewSection: ViewMotionCommentSection): Promise<void> {
        await this.dataSend.deleteModel(viewSection.section);
    }

    /**
     * Saves a comment made at a MotionCommentSection
     *
     * @param motionId ID of the Motion
     * @param sectionId ID of the Section where the comment was made
     * @param sectionComment the comment text
     * @returns the promise to create the object
     */
    public async saveComment(motionId: number, sectionId: number, sectionComment: String): Promise<object> {
        return this.http.post(`rest/motions/motion/${motionId}/manage_comments/`, {
            section_id: sectionId,
            comment: sectionComment
        });
    }
}
