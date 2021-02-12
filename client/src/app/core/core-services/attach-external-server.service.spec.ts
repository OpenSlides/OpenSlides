import { TestBed } from '@angular/core/testing';

import { AttachExternalServerService } from './attach-external-server.service';

describe('AttachExternalServerService', () => {
    let service: AttachExternalServerService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(AttachExternalServerService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
