import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { ProjectorService } from './projector.service';

describe('ProjectorService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [ProjectorService]
        });
    });

    it('should be created', inject([ProjectorService], (service: ProjectorService) => {
        expect(service).toBeTruthy();
    }));
});
