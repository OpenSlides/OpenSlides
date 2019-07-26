import { inject, TestBed } from '@angular/core/testing';

import { DataSendService } from './data-send.service';
import { E2EImportsModule } from '../../../e2e-imports.module';

describe('DataSendService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [DataSendService]
        });
    });

    it('should be created', inject([DataSendService], (service: DataSendService) => {
        expect(service).toBeTruthy();
    }));
});
