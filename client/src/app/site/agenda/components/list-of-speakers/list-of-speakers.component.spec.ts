import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { E2EImportsModule } from '../../../../../e2e-imports.module';
import { ListOfSpeakersComponent } from './list-of-speakers.component';

describe('ListOfSpeakersComponent', () => {
    let component: ListOfSpeakersComponent;
    let fixture: ComponentFixture<ListOfSpeakersComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                imports: [E2EImportsModule],
                declarations: [ListOfSpeakersComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(ListOfSpeakersComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
