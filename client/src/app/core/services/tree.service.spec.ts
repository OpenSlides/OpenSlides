import { TestBed, inject } from '@angular/core/testing';

import { TreeService } from './tree.service';
import { E2EImportsModule } from '../../../e2e-imports.module';

describe('TreeService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [TreeService]
        });
    });

    it('should be created', inject([TreeService], (service: TreeService) => {
        expect(service).toBeTruthy();
    }));
});
