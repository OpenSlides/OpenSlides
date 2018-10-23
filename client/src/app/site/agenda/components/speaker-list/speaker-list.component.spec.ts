import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SpeakerListComponent } from './speaker-list.component';
import { E2EImportsModule } from '../../../../../e2e-imports.module';

describe('SpeakerListComponent', () => {
    let component: SpeakerListComponent;
    let fixture: ComponentFixture<SpeakerListComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SpeakerListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
