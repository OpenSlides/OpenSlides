import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MediafileSlideComponent } from './mediafile-slide.component';
import { E2EImportsModule } from '../../../../e2e-imports.module';
import { PdfViewerModule } from 'ng2-pdf-viewer';

describe('MediafileSlideComponent', () => {
    let component: MediafileSlideComponent;
    let fixture: ComponentFixture<MediafileSlideComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule, PdfViewerModule],
            declarations: [MediafileSlideComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(MediafileSlideComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
