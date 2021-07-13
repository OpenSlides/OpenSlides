import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { MessageControlsComponent } from './message-controls.component';

describe('MessageControlsComponent', () => {
    let component: MessageControlsComponent;
    let fixture: ComponentFixture<MessageControlsComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                imports: [E2EImportsModule],
                declarations: [MessageControlsComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(MessageControlsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
