import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { ViewAssignment } from 'app/site/assignments/models/view-assignment';
import { Assignment } from 'app/shared/models/assignments/assignment';
import { User } from 'app/shared/models/users/user';
import { Tag } from 'app/shared/models/core/tag';
import { Item } from 'app/shared/models/agenda/item';
import { DataStoreService } from '../../core-services/data-store.service';
import { Identifiable } from 'app/shared/models/base/identifiable';
import { CollectionStringMapperService } from '../../core-services/collectionStringMapper.service';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { ViewItem } from 'app/site/agenda/models/view-item';
import { ViewUser } from 'app/site/users/models/view-user';
import { ViewTag } from 'app/site/tags/models/view-tag';
import { BaseAgendaContentObjectRepository } from '../base-agenda-content-object-repository';

/**
 * Repository Service for Assignments.
 *
 * Documentation partially provided in {@link BaseRepository}
 */
@Injectable({
    providedIn: 'root'
})
export class AssignmentRepositoryService extends BaseAgendaContentObjectRepository<ViewAssignment, Assignment> {
    /**
     * Constructor for the Assignment Repository.
     *
     * @param DS The DataStore
     * @param mapperService Maps collection strings to classes
     */
    public constructor(
        DS: DataStoreService,
        mapperService: CollectionStringMapperService,
        viewModelStoreService: ViewModelStoreService,
        private translate: TranslateService
    ) {
        super(DS, mapperService, viewModelStoreService, Assignment, [User, Item, Tag]);
    }

    public getAgendaTitle = (assignment: Partial<Assignment> | Partial<ViewAssignment>) => {
        return assignment.title;
    };

    public getAgendaTitleWithType = (assignment: Partial<Assignment> | Partial<ViewAssignment>) => {
        return assignment.title + ' (' + this.getVerboseName() + ')';
    };

    public getVerboseName = (plural: boolean = false) => {
        return this.translate.instant(plural ? 'Elections' : 'Election');
    };

    public createViewModel(assignment: Assignment): ViewAssignment {
        const relatedUser = this.viewModelStoreService.getMany(ViewUser, assignment.candidates_id);
        const agendaItem = this.viewModelStoreService.get(ViewItem, assignment.agenda_item_id);
        const tags = this.viewModelStoreService.getMany(ViewTag, assignment.tags_id);

        const viewAssignment = new ViewAssignment(assignment, relatedUser, agendaItem, tags);
        viewAssignment.getVerboseName = this.getVerboseName;
        viewAssignment.getAgendaTitle = () => this.getAgendaTitle(viewAssignment);
        viewAssignment.getAgendaTitleWithType = () => this.getAgendaTitleWithType(viewAssignment);
        return viewAssignment;
    }

    public async update(assignment: Partial<Assignment>, viewAssignment: ViewAssignment): Promise<void> {
        return null;
    }

    public async delete(viewAssignment: ViewAssignment): Promise<void> {
        return null;
    }

    public async create(assignment: Assignment): Promise<Identifiable> {
        return null;
    }
}
