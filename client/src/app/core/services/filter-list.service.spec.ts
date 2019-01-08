import { TestBed } from '@angular/core/testing';

import { FilterListService } from './filter-list.service';
import { E2EImportsModule } from '../../../e2e-imports.module';

describe('FilterListService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [FilterListService]
        });
    });

    // TODO testing needs a BaseViewComponent
    // it('should be created', inject([FilterListService], (service: FilterListService) => {
    //     expect(service).toBeTruthy();
    // }));
});
