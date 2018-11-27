import { TestBed } from '@angular/core/testing';

import { ChoiceService } from './choice.service';
import { E2EImportsModule } from 'e2e-imports.module';

describe('ChoiceService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [ChoiceService]
        });
    });

    it('should be created', () => {
        const service: ChoiceService = TestBed.get(ChoiceService);
        expect(service).toBeTruthy();
    });
});
