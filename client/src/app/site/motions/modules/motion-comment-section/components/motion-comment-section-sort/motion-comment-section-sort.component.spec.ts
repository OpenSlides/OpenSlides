import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { MotionCommentSectionSortComponent } from './motion-comment-section-sort.component';

describe('MotionCommentSectionSortComponent', () => {
    let component: MotionCommentSectionSortComponent;
    let fixture: ComponentFixture<MotionCommentSectionSortComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                imports: [E2EImportsModule],
                declarations: [MotionCommentSectionSortComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(MotionCommentSectionSortComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
