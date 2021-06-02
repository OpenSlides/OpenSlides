import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { InteractionService } from './interaction.service';

describe('InteractionService', () => {
    let service: InteractionService;

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [E2EImportsModule] });
        service = TestBed.inject(InteractionService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
