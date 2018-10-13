import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LegalNoticeComponent } from './legal-notice.component';
import { E2EImportsModule } from '../../../../../e2e-imports.module';

describe('LegalNoticeComponent', () => {
    let component: LegalNoticeComponent;
    let fixture: ComponentFixture<LegalNoticeComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
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
