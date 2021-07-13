import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { E2EImportsModule } from '../../../../../e2e-imports.module';
import { LoginMaskComponent } from './login-mask.component';

describe('LoginMaskComponent', () => {
    let component: LoginMaskComponent;
    let fixture: ComponentFixture<LoginMaskComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                imports: [E2EImportsModule]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(LoginMaskComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    // TODO: mock HTTPClient
    /*it('should have an forget password button', async(() => {
        const compiled = fixture.debugElement.nativeElement;
        expect(compiled.querySelector('.forgot-password-button').textContent).toContain('Forgot Password?');
    }));*/
});
