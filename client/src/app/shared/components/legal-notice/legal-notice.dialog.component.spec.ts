import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LegalnoticeDialogComponent } from './legal-notice.dialog.component';

describe('LegalnoticeDialogComponent', () => {
    let component: LegalnoticeDialogComponent;
    let fixture: ComponentFixture<LegalnoticeDialogComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [LegalnoticeDialogComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(LegalnoticeDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
