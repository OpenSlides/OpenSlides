import { async, TestBed, ComponentFixture } from '@angular/core/testing';

import { AttachmentControlComponent } from './attachment-control.component';
import { E2EImportsModule } from 'e2e-imports.module';

describe('AttachmentControlComponent', () => {
    let component: AttachmentControlComponent;
    let fixture: ComponentFixture<AttachmentControlComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AttachmentControlComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
