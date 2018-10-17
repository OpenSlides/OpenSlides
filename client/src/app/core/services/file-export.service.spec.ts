import { TestBed, inject } from '@angular/core/testing';

import { FileExportService } from './file-export.service';
import { E2EImportsModule } from '../../../e2e-imports.module';

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
