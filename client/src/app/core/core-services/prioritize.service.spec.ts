import { TestBed, inject } from '@angular/core/testing';

import { PrioritizeService } from './prioritize.service';
import { E2EImportsModule } from '../../../e2e-imports.module';

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
