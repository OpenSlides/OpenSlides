import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AgendaListComponent } from './agenda-list.component';
import { E2EImportsModule } from '../../../../../e2e-imports.module';

describe('AgendaListComponent', () => {
    let component: AgendaListComponent;
    let fixture: ComponentFixture<AgendaListComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                imports: [E2EImportsModule],
                declarations: [AgendaListComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(AgendaListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
