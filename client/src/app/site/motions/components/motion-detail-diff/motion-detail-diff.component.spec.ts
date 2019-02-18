import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from '../../../../../e2e-imports.module';
import { Component } from '@angular/core';
import { LineNumberingMode, ViewMotion } from '../../models/view-motion';
import { MotionDetailDiffComponent } from './motion-detail-diff.component';
import { MotionDetailOriginalChangeRecommendationsComponent } from '../motion-detail-original-change-recommendations/motion-detail-original-change-recommendations.component';
import { ViewUnifiedChange } from '../../../../shared/models/motions/view-unified-change';
import { Motion } from 'app/shared/models/motions/motion';
import { ViewMotionChangeRecommendation } from '../../models/view-change-recommendation';

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

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [
                TestHostComponent,
                MotionDetailDiffComponent,
                MotionDetailOriginalChangeRecommendationsComponent
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(TestHostComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
