import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';

import { E2EImportsModule } from 'e2e-imports.module';

import { ResetPasswordConfirmComponent } from './reset-password-confirm.component';

let matSnackBarSpy: MatSnackBar;

describe('ResetPasswordConfirmComponent', () => {
    let component: ResetPasswordConfirmComponent;
    let fixture: ComponentFixture<ResetPasswordConfirmComponent>;

    beforeEach(async(() => {
        const spy = jasmine.createSpyObj('MatSnackBar', ['open']);

        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [{ provide: MatSnackBar, useValue: spy }]
        }).compileComponents();
        matSnackBarSpy = TestBed.inject(MatSnackBar);
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ResetPasswordConfirmComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    /**
     * TODO:
     * TestBed.inject does not return a spy anmore, thus this seems to be deprecated.
     */
    // xit('should open a snackbar error', fakeAsync(() => {
    //     // WTF? I do not kno what to do more, but the expect should run after the set timeout...
    //     fixture.detectChanges();
    //     tick();
    //     fixture.detectChanges();
    //     flush();
    //     fixture.detectChanges();
    //     flushMicrotasks();
    //     fixture.detectChanges();
    //     // expect(matSnackBarSpy.open.calls.count()).toBe(1, 'mat snack bar was opened');
    //     // expect(matSnackBarSpy.open.
    // }));
});
