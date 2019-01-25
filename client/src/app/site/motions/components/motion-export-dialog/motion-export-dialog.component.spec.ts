import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MotionExportDialogComponent } from './motion-export-dialog.component';
import { E2EImportsModule } from 'e2e-imports.module';
import { MatDialogRef } from '@angular/material';

describe('MotionExportDialogComponent', () => {
    let component: MotionExportDialogComponent;
    let fixture: ComponentFixture<MotionExportDialogComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [MotionExportDialogComponent],
            providers: [{ provide: MatDialogRef, useValue: {} }]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(MotionExportDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
