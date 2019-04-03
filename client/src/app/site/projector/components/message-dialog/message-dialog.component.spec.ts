import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MessageDialogComponent, MessageData } from './message-dialog.component';
import { E2EImportsModule } from 'e2e-imports.module';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

describe('MessageDialogComponent', () => {
    let component: MessageDialogComponent;
    let fixture: ComponentFixture<MessageDialogComponent>;

    const dialogData: MessageData = {
        text: ''
    };

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [MessageDialogComponent],
            imports: [E2EImportsModule],
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
        fixture = TestBed.createComponent(MessageDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
