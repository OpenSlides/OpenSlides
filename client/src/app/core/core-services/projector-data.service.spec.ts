import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from '../../../e2e-imports.module';
import { ProjectorDataService } from './projector-data.service';

describe('ProjectorDataService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [ProjectorDataService]
        });
    });
    it('should be created', inject([ProjectorDataService], (service: ProjectorDataService) => {
        expect(service).toBeTruthy();
    }));
});
