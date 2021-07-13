import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { E2EImportsModule } from '../../../../../e2e-imports.module';
import { LoginLegalNoticeComponent } from './login-legal-notice.component';

describe('LoginLegalNoticeComponent', () => {
    let component: LoginLegalNoticeComponent;
    let fixture: ComponentFixture<LoginLegalNoticeComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                imports: [E2EImportsModule]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(LoginLegalNoticeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
