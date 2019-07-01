import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
    MotionChangeRecommendationComponent,
    MotionChangeRecommendationComponentData
} from './motion-change-recommendation.component';

import { E2EImportsModule } from 'e2e-imports.module';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ModificationType } from 'app/core/ui-services/diff.service';
import { ViewMotionChangeRecommendation } from 'app/site/motions/models/view-motion-change-recommendation';

describe('MotionChangeRecommendationComponent', () => {
    let component: MotionChangeRecommendationComponent;
    let fixture: ComponentFixture<MotionChangeRecommendationComponent>;

    const changeReco = <ViewMotionChangeRecommendation>{
        line_from: 1,
        line_to: 2,
        type: ModificationType.TYPE_REPLACEMENT,
        text: '<p>',
        rejected: false,
        motion_id: 1
    };
    const dialogData: MotionChangeRecommendationComponentData = {
        newChangeRecommendation: true,
        editChangeRecommendation: false,
        changeRecommendation: changeReco,
        lineRange: { from: 1, to: 2 }
    };

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [MotionChangeRecommendationComponent],
            providers: [
                { provide: MatDialogRef, useValue: {} },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: dialogData
                }
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(MotionChangeRecommendationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
