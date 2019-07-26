import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from '../../../e2e-imports.module';
import { PingService } from './ping.service';

describe('PingService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [PingService]
        });
    });

    it('should be created', inject([PingService], (service: PingService) => {
        expect(service).toBeTruthy();
    }));
});
