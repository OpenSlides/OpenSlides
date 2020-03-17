import { async, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

describe('ChartsComponent', () => {
    // let component: ChartsComponent;
    // let fixture: ComponentFixture<ChartsComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        }).compileComponents();
    }));

    beforeEach(() => {
        // fixture = TestBed.createComponent(ChartsComponent);
        // component = fixture.componentInstance;
        // fixture.detectChanges();
    });

    it('should create', () => {
        // expect(component).toBeTruthy();
    });
});
