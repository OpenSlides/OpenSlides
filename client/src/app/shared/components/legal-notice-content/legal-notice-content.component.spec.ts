import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LegalNoticeContentComponent } from './legal-notice-content.component';

describe('LegalNoticeComponent', () => {
    let component: LegalNoticeContentComponent;
    let fixture: ComponentFixture<LegalNoticeContentComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [LegalNoticeContentComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(LegalNoticeContentComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
