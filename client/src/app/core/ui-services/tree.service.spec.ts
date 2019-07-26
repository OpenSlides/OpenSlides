import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from '../../../e2e-imports.module';
import { TreeService } from './tree.service';

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
