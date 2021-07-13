import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { E2EImportsModule } from '../../../../../e2e-imports.module';
import { LoginPrivacyPolicyComponent } from './login-privacy-policy.component';

describe('LoginPrivacyPolicyComponent', () => {
    let component: LoginPrivacyPolicyComponent;
    let fixture: ComponentFixture<LoginPrivacyPolicyComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                imports: [E2EImportsModule]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(LoginPrivacyPolicyComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
