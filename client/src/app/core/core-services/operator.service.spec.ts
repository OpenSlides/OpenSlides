import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from '../../../e2e-imports.module';
import { OperatorService } from './operator.service';

describe('OperatorService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [OperatorService]
        });
    });

    it('should be created', inject([OperatorService], (service: OperatorService) => {
        expect(service).toBeTruthy();
    }));
});
