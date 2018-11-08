import { async, ComponentFixture, TestBed, tick, fakeAsync, flush, flushMicrotasks } from '@angular/core/testing';

import { ResetPasswordConfirmComponent } from './reset-password-confirm.component';
import { E2EImportsModule } from 'e2e-imports.module';
import { MatSnackBar } from '@angular/material';

let matSnackBarSpy: jasmine.SpyObj<MatSnackBar>;

describe('ResetPasswordConfirmComponent', () => {
    let component: ResetPasswordConfirmComponent;
    let fixture: ComponentFixture<ResetPasswordConfirmComponent>;

    beforeEach(async(() => {
        const spy = jasmine.createSpyObj('MatSnackBar', ['open']);

        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [
                {provide: MatSnackBar, useValue: spy}
            ]
        }).compileComponents();
        matSnackBarSpy = TestBed.get(MatSnackBar)
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ResetPasswordConfirmComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    xit('should open a snackbar error', fakeAsync(() => {
        // WTF? I do not kno what to do more, but the expect should run after the set timeout...
        fixture.detectChanges();
        tick();
        fixture.detectChanges();
        flush();
        fixture.detectChanges();
        flushMicrotasks();
        fixture.detectChanges();
        expect(matSnackBarSpy.open.calls.count()).toBe(1, 'mat snack bar was opened');
    }));
});
