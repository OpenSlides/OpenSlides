import { TestBed, inject } from '@angular/core/testing';

import { RoutingStateService } from './routing-state.service';
import { E2EImportsModule } from 'e2e-imports.module';

describe('RoutingStateService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [RoutingStateService]
        });
    });

    it('should be created', inject([RoutingStateService], (service: RoutingStateService) => {
        expect(service).toBeTruthy();
    }));
});
