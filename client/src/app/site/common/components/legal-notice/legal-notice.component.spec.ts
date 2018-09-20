import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LegalNoticeComponent } from './legal-notice.component';

describe('LegalNoticeComponent', () => {
    let component: LegalNoticeComponent;
    let fixture: ComponentFixture<LegalNoticeComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [LegalNoticeComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(LegalNoticeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
