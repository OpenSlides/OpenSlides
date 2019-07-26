import { inject, TestBed } from '@angular/core/testing';

import { MainMenuService } from './main-menu.service';

describe('MainMenuService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [MainMenuService]
        });
    });

    it('should be created', inject([MainMenuService], (service: MainMenuService) => {
        expect(service).toBeTruthy();
    }));
});
