import { Injectable } from '@angular/core';
import { ViewAssignment } from '../models/view-assignment';
import { Assignment } from '../../../shared/models/assignments/assignment';
import { User } from '../../../shared/models/users/user';
import { Tag } from '../../../shared/models/core/tag';
import { Item } from '../../../shared/models/agenda/item';
import { BaseRepository } from '../../base/base-repository';
import { DataStoreService } from '../../../core/services/data-store.service';
import { Identifiable } from '../../../shared/models/base/identifiable';
import { CollectionStringModelMapperService } from '../../../core/services/collectionStringModelMapper.service';

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
     */
    public constructor(DS: DataStoreService, mapperService: CollectionStringModelMapperService) {
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
