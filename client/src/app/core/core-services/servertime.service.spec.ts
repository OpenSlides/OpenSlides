import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from '../../../e2e-imports.module';
import { ServertimeService } from './servertime.service';

describe('ServertimeService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [ServertimeService]
        });
    });

    it('should be created', inject([ServertimeService], (service: ServertimeService) => {
        expect(service).toBeTruthy();
    }));
});
