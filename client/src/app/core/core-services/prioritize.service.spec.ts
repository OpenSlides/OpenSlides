import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from '../../../e2e-imports.module';
import { PrioritizeService } from './prioritize.service';

describe('PrioritizeService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [PrioritizeService]
        });
    });

    it('should be created', inject([PrioritizeService], (service: PrioritizeService) => {
        expect(service).toBeTruthy();
    }));
});
