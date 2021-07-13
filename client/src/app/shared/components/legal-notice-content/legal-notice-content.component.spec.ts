import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { E2EImportsModule } from '../../../../e2e-imports.module';
import { LegalNoticeContentComponent } from './legal-notice-content.component';

describe('LegalNoticeComponent', () => {
    let component: LegalNoticeContentComponent;
    let fixture: ComponentFixture<LegalNoticeContentComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                imports: [E2EImportsModule]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(LegalNoticeContentComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
