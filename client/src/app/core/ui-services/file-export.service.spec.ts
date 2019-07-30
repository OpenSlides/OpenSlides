import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from '../../../e2e-imports.module';
import { FileExportService } from './file-export.service';

describe('FileExportService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [FileExportService]
        });
    });

    it('should be created', inject([FileExportService], (service: FileExportService) => {
        expect(service).toBeTruthy();
    }));
});
