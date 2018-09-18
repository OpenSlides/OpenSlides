import { TestBed } from '@angular/core/testing';

import { AssignmentRepositoryService } from './assignment-repository.service';

describe('AssignmentRepositoryService', () => {
    beforeEach(() => TestBed.configureTestingModule({}));

    it('should be created', () => {
        const service: AssignmentRepositoryService = TestBed.get(AssignmentRepositoryService);
        expect(service).toBeTruthy();
    });
});
