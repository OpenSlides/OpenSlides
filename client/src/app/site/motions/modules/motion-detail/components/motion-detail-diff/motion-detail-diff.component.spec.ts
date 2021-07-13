import { Component } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { Motion } from 'app/shared/models/motions/motion';
import { ViewUnifiedChange } from 'app/shared/models/motions/view-unified-change';
import { ViewMotion } from 'app/site/motions/models/view-motion';
import { ViewMotionChangeRecommendation } from 'app/site/motions/models/view-motion-change-recommendation';
import { LineNumberingMode } from 'app/site/motions/motions.constants';
import { MotionDetailDiffComponent } from './motion-detail-diff.component';
import { MotionDetailOriginalChangeRecommendationsComponent } from '../motion-detail-original-change-recommendations/motion-detail-original-change-recommendations.component';

@Component({
    template: `
        <os-motion-detail-diff
            [motion]="motion"
            [changes]="changes"
            [highlightedLine]="highlightedLine"
            [scrollToChange]="scrollToChange"
            [lineNumberingMode]="lnMode"
            (createChangeRecommendation)="createChangeRecommendation($event)"
        >
        </os-motion-detail-diff>
    `
})
class TestHostComponent {
    public motion: ViewMotion;
    public changes: ViewMotionChangeRecommendation[];
    public lnMode: LineNumberingMode = LineNumberingMode.Outside;
    public scrollToChange: ViewUnifiedChange = null;

    public constructor() {
        this.motion = new ViewMotion(new Motion());
        this.changes = [];
    }

    public createChangeRecommendation($event: Event): void {}
}

describe('MotionDetailDiffComponent', () => {
    let component: TestHostComponent;
    let fixture: ComponentFixture<TestHostComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                imports: [E2EImportsModule],
                declarations: [
                    TestHostComponent,
                    MotionDetailDiffComponent,
                    MotionDetailOriginalChangeRecommendationsComponent
                ]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(TestHostComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
