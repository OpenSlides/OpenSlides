import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginLegalNoticeComponent } from './login-legal-notice.component';

describe('LoginLegalNoticeComponent', () => {
    let component: LoginLegalNoticeComponent;
    let fixture: ComponentFixture<LoginLegalNoticeComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [LoginLegalNoticeComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(LoginLegalNoticeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
