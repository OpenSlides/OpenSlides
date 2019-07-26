import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from '../../../e2e-imports.module';
import { NotifyService } from './notify.service';

describe('NotifyService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [NotifyService]
        });
    });

    it('should be created', inject([NotifyService], (service: NotifyService) => {
        expect(service).toBeTruthy();
    }));
});
