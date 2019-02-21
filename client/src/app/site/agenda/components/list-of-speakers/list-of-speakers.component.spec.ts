import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ListOfSpeakersComponent } from './list-of-speakers.component';
import { E2EImportsModule } from '../../../../../e2e-imports.module';

describe('ListOfSpeakersComponent', () => {
    let component: ListOfSpeakersComponent;
    let fixture: ComponentFixture<ListOfSpeakersComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [ListOfSpeakersComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ListOfSpeakersComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
