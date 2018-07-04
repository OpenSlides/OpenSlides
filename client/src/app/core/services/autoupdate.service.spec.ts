import { TestBed, inject } from '@angular/core/testing';

import { AutoupdateService } from './autoupdate.service';

describe('AutoupdateService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [AutoupdateService]
        });
    });

    it('should be created', inject([AutoupdateService], (service: AutoupdateService) => {
        expect(service).toBeTruthy();
    }));
});
