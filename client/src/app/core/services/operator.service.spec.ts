import { TestBed, inject } from '@angular/core/testing';

import { OperatorService } from './operator.service';
import { E2EImportsModule } from '../../../e2e-imports.module';

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
