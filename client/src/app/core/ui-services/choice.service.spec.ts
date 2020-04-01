import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { ChoiceService } from './choice.service';

describe('ChoiceService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [ChoiceService]
        });
    });

    it('should be created', () => {
        const service: ChoiceService = TestBed.inject(ChoiceService);
        expect(service).toBeTruthy();
    });
});
