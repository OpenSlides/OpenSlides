import { TestBed, inject } from '@angular/core/testing';

import { PromptService } from './prompt.service';
import { E2EImportsModule } from 'e2e-imports.module';

describe('PromptService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [PromptService]
        });
    });

    it('should be created', inject([PromptService], (service: PromptService) => {
        expect(service).toBeTruthy();
    }));
});
