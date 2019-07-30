import { inject, TestBed } from '@angular/core/testing';

import { AutoupdateService } from './autoupdate.service';
import { E2EImportsModule } from '../../../e2e-imports.module';

describe('AutoupdateService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [AutoupdateService]
        });
    });

    it('should be created', inject([AutoupdateService], (service: AutoupdateService) => {
        expect(service).toBeTruthy();
    }));
});
