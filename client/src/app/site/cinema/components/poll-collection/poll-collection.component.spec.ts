import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { PollCollectionComponent } from './poll-collection.component';
import { PollProgressComponent } from "../../../polls/components/poll-progress/poll-progress.component";

describe('PollCollectionComponent', () => {
    let component: PollCollectionComponent;
    let fixture: ComponentFixture<PollCollectionComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [PollCollectionComponent, PollProgressComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(PollCollectionComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
