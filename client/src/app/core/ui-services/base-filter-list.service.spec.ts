import { TestBed } from '@angular/core/testing';

import { BaseFilterListService } from './base-filter-list.service';
import { E2EImportsModule } from '../../../e2e-imports.module';

describe('BaseFilterListService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [BaseFilterListService]
        });
    });

    // TODO testing needs an actual service..
    // it('should be created', inject([FilterListService], (service: FilterListService) => {
    //     expect(service).toBeTruthy();
    // }));
});
