import { TestBed, inject } from '@angular/core/testing';

import { ConfigService } from './config.service';
import { E2EImportsModule } from 'e2e-imports.module';

describe('ConfigService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [ConfigService]
        });
    });

    it('should be created', inject([ConfigService], (service: ConfigService) => {
        expect(service).toBeTruthy();
    }));
});
