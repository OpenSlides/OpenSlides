import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MediaUploadComponent } from './media-upload.component';
import { E2EImportsModule } from 'e2e-imports.module';

describe('MediaUploadComponent', () => {
    let component: MediaUploadComponent;
    let fixture: ComponentFixture<MediaUploadComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [MediaUploadComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(MediaUploadComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
