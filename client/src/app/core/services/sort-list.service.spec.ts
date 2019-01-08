import { TestBed } from '@angular/core/testing';

import { SortListService } from './sort-list.service';
import { E2EImportsModule } from '../../../e2e-imports.module';

describe('SortListService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [SortListService]
        });
    });

    // TODO testing (does not work without injecting a BaseViewComponent)
    // it('should be created', inject([SortListService], (service: SortListService) => {
    //     expect(service).toBeTruthy();
    // }));
});
