import { TestBed } from '@angular/core/testing';

import { RoutingStateService } from './routing-state.service';
import { E2EImportsModule } from 'e2e-imports.module';

describe('RoutingStateService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        })
    );

    it('should be created', () => {
        const service: RoutingStateService = TestBed.get(RoutingStateService);
        expect(service).toBeTruthy();
    });
});
