import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { PromptService } from './prompt.service';

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
