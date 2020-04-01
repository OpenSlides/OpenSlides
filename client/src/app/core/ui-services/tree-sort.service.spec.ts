import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from '../../../e2e-imports.module';
import { TreeSortService } from './tree-sort.service';

describe('TreeSortService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [TreeSortService]
        })
    );

    // TODO testing (does not work without injecting a BaseViewComponent)
    //   it('should be created', () => {
    //     const service: TreeSortService = TestBed.inject(TreeSortService);
    //     expect(service).toBeTruthy();
    //   });
});
