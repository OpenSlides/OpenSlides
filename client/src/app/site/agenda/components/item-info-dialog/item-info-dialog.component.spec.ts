import { async, TestBed } from '@angular/core/testing';

// import { ItemInfoDialogComponent } from './item-info-dialog.component';
import { E2EImportsModule } from 'e2e-imports.module';

describe('ItemInfoDialogComponent', () => {
    // let component: ItemInfoDialogComponent;
    // let fixture: ComponentFixture<ItemInfoDialogComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        }).compileComponents();
    }));

    // TODO: You cannot create this component in the standard way. Needs different testing.
    beforeEach(() => {
        /*fixture = TestBed.createComponent(ItemInfoDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();*/
    });

    /*it('should create', () => {
        expect(component).toBeTruthy();
    });*/
});
