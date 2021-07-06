import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CountUsersComponent } from '../count-users/count-users.component';
import { E2EImportsModule } from '../../../../../e2e-imports.module';
import { LegalNoticeComponent } from './legal-notice.component';

describe('LegalNoticeComponent', () => {
    let component: LegalNoticeComponent;
    let fixture: ComponentFixture<LegalNoticeComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                imports: [E2EImportsModule],
                declarations: [LegalNoticeComponent, CountUsersComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(LegalNoticeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
