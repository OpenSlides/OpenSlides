import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { E2EImportsModule } from 'e2e-imports.module';

import { ModificationType } from 'app/core/ui-services/diff.service';
import { ViewMotionChangeRecommendation } from 'app/site/motions/models/view-motion-change-recommendation';
import {
    MotionTitleChangeRecommendationDialogComponent,
    MotionTitleChangeRecommendationDialogComponentData
} from './motion-title-change-recommendation-dialog.component';

describe('MotionTitleChangeRecommendationDialogComponent', () => {
    let component: MotionTitleChangeRecommendationDialogComponent;
    let fixture: ComponentFixture<MotionTitleChangeRecommendationDialogComponent>;

    const changeReco = <ViewMotionChangeRecommendation>{
        line_from: 0,
        line_to: 0,
        type: ModificationType.TYPE_REPLACEMENT,
        text: 'Motion title',
        rejected: false,
        motion_id: 1
    };
    const dialogData: MotionTitleChangeRecommendationDialogComponentData = {
        newChangeRecommendation: true,
        editChangeRecommendation: false,
        changeRecommendation: changeReco
    };

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [MotionTitleChangeRecommendationDialogComponent],
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
        fixture = TestBed.createComponent(MotionTitleChangeRecommendationDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
