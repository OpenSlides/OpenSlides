import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CountdownDialogComponent, CountdownData } from './countdown-dialog.component';
import { E2EImportsModule } from 'e2e-imports.module';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

describe('CountdownDialogComponent', () => {
    let component: CountdownDialogComponent;
    let fixture: ComponentFixture<CountdownDialogComponent>;

    const dialogData: CountdownData = {
        title: '',
        description: '',
        duration: ''
    };

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [CountdownDialogComponent],
            providers: [
                { provide: MatDialogRef, useValue: {} },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: dialogData
                }
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(CountdownDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
