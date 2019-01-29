import { TestBed, async } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { E2EImportsModule } from './../e2e-imports.module';
import { ServertimeService } from './core/services/servertime.service';

describe('AppComponent', () => {
    let servertimeService;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        }).compileComponents();

        servertimeService = TestBed.get(ServertimeService);
        spyOn(servertimeService, 'startScheduler').and.stub();
    }));
    it('should create the app', async(() => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.debugElement.componentInstance;
        expect(app).toBeTruthy();
        expect(servertimeService.startScheduler).toHaveBeenCalled();
    }));
});
