import { inject, TestBed } from '@angular/core/testing';

import { AppLoadService } from './app-load.service';
import { E2EImportsModule } from '../../../e2e-imports.module';

describe('AppLoadService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [AppLoadService]
        });
    });
    it('should be created', inject([AppLoadService], (service: AppLoadService) => {
        expect(service).toBeTruthy();
    }));
});
