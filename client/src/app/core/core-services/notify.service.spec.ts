import { TestBed, inject } from '@angular/core/testing';

import { NotifyService } from './notify.service';
import { E2EImportsModule } from '../../../e2e-imports.module';

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
