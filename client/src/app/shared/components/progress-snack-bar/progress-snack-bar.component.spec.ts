import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBarRef } from '@angular/material/snack-bar';

import { E2EImportsModule } from 'e2e-imports.module';

import { ProgressSnackBarComponent } from './progress-snack-bar.component';

describe('ProgressSnackBarComponent', () => {
    let component: ProgressSnackBarComponent;
    let fixture: ComponentFixture<ProgressSnackBarComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [{ provide: MatSnackBarRef, useValue: {} }]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ProgressSnackBarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
