import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TagListComponent } from './tag-list.component';
import { E2EImportsModule } from '../../../../e2e-imports.module';

describe('TagListComponent', () => {
    let component: TagListComponent;
    let fixture: ComponentFixture<TagListComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [TagListComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(TagListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
