import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { MotionMultiselectService } from './motion-multiselect.service';

describe('MotionMultiselectService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [MotionMultiselectService]
        });
    });

    it('should be created', inject([MotionMultiselectService], (service: MotionMultiselectService) => {
        expect(service).toBeTruthy();
    }));
});
