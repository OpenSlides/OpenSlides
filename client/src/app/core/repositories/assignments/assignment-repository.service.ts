import { Injectable } from '@angular/core';
import { ViewAssignment } from 'app/site/assignments/models/view-assignment';
import { Assignment } from 'app/shared/models/assignments/assignment';
import { User } from 'app/shared/models/users/user';
import { Tag } from 'app/shared/models/core/tag';
import { Item } from 'app/shared/models/agenda/item';
import { BaseRepository } from '../base-repository';
import { DataStoreService } from '../../core-services/data-store.service';
import { Identifiable } from 'app/shared/models/base/identifiable';
import { CollectionStringMapperService } from '../../core-services/collectionStringMapper.service';

/**
 * Repository Service for Assignments.
 *
 * Documentation partially provided in {@link BaseRepository}
 */
@Injectable({
    providedIn: 'root'
})
export class AssignmentRepositoryService extends BaseRepository<ViewAssignment, Assignment> {
    /**
     * Constructor for the Assignment Repository.
     *
     * @param DS The DataStore
     * @param mapperService Maps collection strings to classes
     */
    public constructor(DS: DataStoreService, mapperService: CollectionStringMapperService) {
        super(DS, mapperService, Assignment, [User, Item, Tag]);
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

    public createViewModel(assignment: Assignment): ViewAssignment {
        const relatedUser = this.DS.getMany(User, assignment.candidateIds);
        const agendaItem = this.DS.get(Item, assignment.agenda_item_id);
        const tags = this.DS.getMany(Tag, assignment.tags_id);

        return new ViewAssignment(assignment, relatedUser, agendaItem, tags);
    }
}
