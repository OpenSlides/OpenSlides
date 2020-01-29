import { inject, TestBed } from '@angular/core/testing';

import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ParsePollNumberPipe } from './parse-poll-number.pipe';

describe('ParsePollNumberPipe', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [TranslateModule.forRoot()],
            declarations: [ParsePollNumberPipe]
        });
        TestBed.compileComponents();
    });

    it('create an instance', inject([TranslateService], (translate: TranslateService) => {
        const pipe = new ParsePollNumberPipe(translate);
        expect(pipe).toBeTruthy();
    }));
});
