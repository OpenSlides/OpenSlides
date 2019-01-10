import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from '../../../../../e2e-imports.module';
import { Component } from '@angular/core';
import { ViewMotion } from '../../models/view-motion';
import { ViewChangeReco } from '../../models/view-change-reco';
import { MotionDetailDiffComponent } from './motion-detail-diff.component';
import { MotionDetailOriginalChangeRecommendationsComponent } from '../motion-detail-original-change-recommendations/motion-detail-original-change-recommendations.component';

@Component({
    template: `
        <os-motion-detail-diff
            [motion]="motion"
            [changes]="changes"
            (scrollToChange)="scrollToChange($event)"
            (createChangeRecommendation)="createChangeRecommendation($event)"
        >
        </os-motion-detail-diff>
    `
})
class TestHostComponent {
    public motion: ViewMotion;
    public changes: ViewChangeReco[];

    public constructor() {
        this.motion = new ViewMotion();
        this.changes = [];
    }

    public scrollToChange($event: Event): void {}

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
