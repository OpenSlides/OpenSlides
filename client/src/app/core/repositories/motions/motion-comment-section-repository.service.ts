import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { HttpService } from 'app/core/core-services/http.service';
import { RelationManagerService } from 'app/core/core-services/relation-manager.service';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { RelationDefinition } from 'app/core/definitions/relations';
import { MotionCommentSection } from 'app/shared/models/motions/motion-comment-section';
import { ViewMotion } from 'app/site/motions/models/view-motion';
import {
    MotionCommentSectionTitleInformation,
    ViewMotionCommentSection
} from 'app/site/motions/models/view-motion-comment-section';
import { ViewGroup } from 'app/site/users/models/view-group';
import { BaseRepository } from '../base-repository';
import { CollectionStringMapperService } from '../../core-services/collection-string-mapper.service';
import { DataSendService } from '../../core-services/data-send.service';
import { DataStoreService } from '../../core-services/data-store.service';

const MotionCommentSectionRelations: RelationDefinition[] = [
    {
        type: 'M2M',
        ownIdKey: 'read_groups_id',
        ownKey: 'read_groups',
        foreignViewModel: ViewGroup
    },
    {
        type: 'M2M',
        ownIdKey: 'write_groups_id',
        ownKey: 'write_groups',
        foreignViewModel: ViewGroup
    }
];

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
    MotionCommentSection,
    MotionCommentSectionTitleInformation
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
        DS: DataStoreService,
        dataSend: DataSendService,
        mapperService: CollectionStringMapperService,
        viewModelStoreService: ViewModelStoreService,
        translate: TranslateService,
        relationManager: RelationManagerService,
        private http: HttpService
    ) {
        super(
            DS,
            dataSend,
            mapperService,
            viewModelStoreService,
            translate,
            relationManager,
            MotionCommentSection,
            MotionCommentSectionRelations
        );

        this.viewModelSortFn = (a: ViewMotionCommentSection, b: ViewMotionCommentSection) => {
            if (a.weight === b.weight) {
                return a.id - b.id;
            } else {
                return a.weight - b.weight;
            }
        };
    }

    public getTitle = (titleInformation: MotionCommentSectionTitleInformation) => {
        return titleInformation.name;
    };

    public getVerboseName = (plural: boolean = false) => {
        return this.translate.instant(plural ? 'Comment sections' : 'Comment section');
    };

    /**
     * Saves a comment made at a MotionCommentSection. Does an update, if
     * there is a comment text. Deletes the comment, if the text is empty.
     *
     * @param motion the motion
     * @param section the section where the comment was made
     * @param sectionComment the comment text
     * @returns the promise from the HTTP request
     */
    public async saveComment(motion: ViewMotion, section: ViewMotionCommentSection, comment: string): Promise<void> {
        if (comment) {
            return await this.updateComment(motion, section, comment);
        } else {
            return await this.deleteComment(motion, section);
        }
    }

    /**
     * Updates the comment. Saves it on the server.
     */
    private async updateComment(motion: ViewMotion, section: ViewMotionCommentSection, comment: string): Promise<void> {
        return await this.http.post(`/rest/motions/motion/${motion.id}/manage_comments/`, {
            section_id: section.id,
            comment: comment
        });
    }

    /**
     * Deletes a comment from the server
     */
    private async deleteComment(motion: ViewMotion, section: ViewMotionCommentSection): Promise<void> {
        return await this.http.delete(`/rest/motions/motion/${motion.id}/manage_comments/`, { section_id: section.id });
    }

    /**
     * Sort all comment sections. All sections must be given excatly once.
     */
    public async sortCommentSections(sections: ViewMotionCommentSection[]): Promise<void> {
        return await this.http.post('/rest/motions/motion-comment-section/sort/', {
            ids: sections.map(section => section.id)
        });
    }
}
