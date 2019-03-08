import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MotionCommentSectionListComponent } from './motion-comment-section-list.component';
import { E2EImportsModule } from 'e2e-imports.module';

describe('MotionCommentSectionListComponent', () => {
    let component: MotionCommentSectionListComponent;
    let fixture: ComponentFixture<MotionCommentSectionListComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [MotionCommentSectionListComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(MotionCommentSectionListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
