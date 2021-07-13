import { TestBed, waitForAsync } from '@angular/core/testing';

// import { SuperSearchComponent } from './super-search.component';
import { E2EImportsModule } from 'e2e-imports.module';

describe('SuperSearchComponent', () => {
    // let component: SuperSearchComponent;
    // let fixture: ComponentFixture<SuperSearchComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                imports: [E2EImportsModule]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        // fixture = TestBed.createComponent(SuperSearchComponent);
        // component = fixture.componentInstance;
        // fixture.detectChanges();
    });

    it('should create', () => {
        // expect(component).toBeTruthy();
    });
});
