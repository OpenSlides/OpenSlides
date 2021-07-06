import { Component } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { MotionDetailOriginalChangeRecommendationsComponent } from './motion-detail-original-change-recommendations.component';

@Component({
    template: `
        <os-motion-detail-original-change-recommendations
            [html]="html"
            [changeRecommendations]="changeRecommendations"
            (createChangeRecommendation)="createChangeRecommendation($event)"
            (gotoChangeRecommendation)="gotoChangeRecommendation($event)"
        >
        </os-motion-detail-original-change-recommendations>
    `
})
class TestHostComponent {
    public html = '<p>Test123</p>';
    public changeRecommendations = [];
    public createChangeRecommendation($event: Event): void {}
    public gotoChangeRecommendation($event: Event): void {}
}

describe('MotionDetailOriginalChangeRecommendationsComponent', () => {
    let component: TestHostComponent;
    let fixture: ComponentFixture<TestHostComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                imports: [E2EImportsModule],
                declarations: [MotionDetailOriginalChangeRecommendationsComponent, TestHostComponent]
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
