import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginMaskComponent } from './login-mask.component';

describe('LoginMaskComponent', () => {
    let component: LoginMaskComponent;
    let fixture: ComponentFixture<LoginMaskComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [LoginMaskComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(LoginMaskComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
