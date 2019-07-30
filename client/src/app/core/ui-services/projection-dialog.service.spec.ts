import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { ProjectionDialogService } from './projection-dialog.service';

describe('ProjectionDialogService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [ProjectionDialogService]
        });
    });

    it('should be created', inject([ProjectionDialogService], (service: ProjectionDialogService) => {
        expect(service).toBeTruthy();
    }));
});
