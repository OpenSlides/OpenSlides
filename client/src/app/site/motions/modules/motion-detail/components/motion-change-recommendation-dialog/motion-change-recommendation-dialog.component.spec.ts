import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { E2EImportsModule } from 'e2e-imports.module';

import { ModificationType } from 'app/core/ui-services/diff.service';
import { ViewMotionChangeRecommendation } from 'app/site/motions/models/view-motion-change-recommendation';
import {
    MotionChangeRecommendationDialogComponent,
    MotionChangeRecommendationDialogComponentData
} from './motion-change-recommendation-dialog.component';

describe('MotionChangeRecommendationComponent', () => {
    let component: MotionChangeRecommendationDialogComponent;
    let fixture: ComponentFixture<MotionChangeRecommendationDialogComponent>;

    const changeReco = <ViewMotionChangeRecommendation>{
        line_from: 1,
        line_to: 2,
        type: ModificationType.TYPE_REPLACEMENT,
        text: '<p>',
        rejected: false,
        motion_id: 1
    };
    const dialogData: MotionChangeRecommendationDialogComponentData = {
        newChangeRecommendation: true,
        editChangeRecommendation: false,
        changeRecommendation: changeReco,
        lineRange: { from: 1, to: 2 }
    };

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [MotionChangeRecommendationDialogComponent],
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
        fixture = TestBed.createComponent(MotionChangeRecommendationDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
