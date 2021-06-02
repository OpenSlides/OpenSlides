import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { CallRestrictionService } from './call-restriction.service';

describe('CallRestrictionService', () => {
    let service: CallRestrictionService;

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [E2EImportsModule] });
        service = TestBed.inject(CallRestrictionService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
