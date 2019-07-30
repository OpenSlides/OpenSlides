import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { UpdateService } from './update.service';

describe('UpdateService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [UpdateService]
        })
    );

    it('should be created', inject([UpdateService], (service: UpdateService) => {
        expect(service).toBeTruthy();
    }));
});
