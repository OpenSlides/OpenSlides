import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { StatuteParagraphListComponent } from './statute-paragraph-list.component';

describe('StatuteParagraphListComponent', () => {
    let component: StatuteParagraphListComponent;
    let fixture: ComponentFixture<StatuteParagraphListComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                imports: [E2EImportsModule],
                declarations: [StatuteParagraphListComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(StatuteParagraphListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
