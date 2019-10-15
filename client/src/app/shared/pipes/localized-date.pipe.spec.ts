import { inject, TestBed } from '@angular/core/testing';

import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { LocalizedDatePipe } from './localized-date.pipe';

describe('LocalizedDatePipe', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [TranslateModule.forRoot()],
            declarations: [LocalizedDatePipe]
        });
        TestBed.compileComponents();
    });

    it('create an instance', inject([TranslateService], (translate: TranslateService) => {
        const pipe = new LocalizedDatePipe(translate);
        expect(pipe).toBeTruthy();
    }));
});
