import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { VideoPlayerComponent } from './video-player.component';

describe('VjsPlayerComponent', () => {
    let component: VideoPlayerComponent;
    let fixture: ComponentFixture<VideoPlayerComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                imports: [E2EImportsModule]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(VideoPlayerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have the nanocosmos video id as videoId', () => {
        const url =
            'https://demo.nanocosmos.de/nanoplayer/embed/1.0.0/nanoplayer.html?entry.rtmp.streamname=abcde-fghij';
        const id = 'abcde-fghij';
        component.videoUrl = url;
        expect(component.videoId).toBe(id);
    });

    it('should have the nanocosmos as player', () => {
        const url =
            'https://demo.nanocosmos.de/nanoplayer/embed/1.0.0/nanoplayer.html?entry.rtmp.streamname=abcde-fghij';
        component.videoUrl = url;
        expect(component.usingNanocosmos).toBe(true);
    });
});
