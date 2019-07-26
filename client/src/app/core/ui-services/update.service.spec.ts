import { TestBed, inject } from '@angular/core/testing';

import { UpdateService } from './update.service';
import { E2EImportsModule } from 'e2e-imports.module';

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
