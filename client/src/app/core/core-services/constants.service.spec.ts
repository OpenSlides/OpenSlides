import { inject, TestBed } from '@angular/core/testing';

import { ConstantsService } from './constants.service';
import { E2EImportsModule } from '../../../e2e-imports.module';

describe('ConstantsService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [ConstantsService]
        });
    });

    it('should be created', inject([ConstantsService], (service: ConstantsService) => {
        expect(service).toBeTruthy();
    }));
});
