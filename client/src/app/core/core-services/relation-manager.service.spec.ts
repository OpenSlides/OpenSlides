import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from '../../../e2e-imports.module';
import { RelationManagerService } from './relation-manager.service';

describe('RelationManagerService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [RelationManagerService]
        });
    });
    it('should be created', inject([RelationManagerService], (service: RelationManagerService) => {
        expect(service).toBeTruthy();
    }));
});
