import { TestBed } from '@angular/core/testing';

import { BaseSortService } from './base-sort.service';
import { E2EImportsModule } from '../../../e2e-imports.module';

describe('BaseSortService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [BaseSortService]
        });
    });

    // TODO testing (does not work without injecting a BaseViewComponent)
    //   it('should be created', () => {
    //     const service: BaseSortService = TestBed.inject(BaseSortService);
    //     expect(service).toBeTruthy();
    //   });
});
