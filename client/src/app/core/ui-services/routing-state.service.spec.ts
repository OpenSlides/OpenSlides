import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { RoutingStateService } from './routing-state.service';

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
