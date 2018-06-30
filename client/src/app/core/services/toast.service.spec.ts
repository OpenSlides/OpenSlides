import { TestBed, inject } from '@angular/core/testing';

import { ToastService } from './toast.service';

describe('ToastService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ToastService]
        });
    });

    it('should be created', inject([ToastService], (service: ToastService) => {
        expect(service).toBeTruthy();
    }));
});
