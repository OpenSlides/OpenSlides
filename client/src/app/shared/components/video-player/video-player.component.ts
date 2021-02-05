import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnDestroy,
    OnInit,
    Output,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';

import { of } from 'rxjs';
import { ajax, AjaxResponse } from 'rxjs/ajax';
import { catchError, map } from 'rxjs/operators';
import videojs from 'video.js';

import { ConfigService } from 'app/core/ui-services/config.service';

enum MimeType {
    mp4 = 'video/mp4',
    mpd = 'application/dash+xml',
    m3u8 = 'application/x-mpegURL'
}

enum Player {
    vjs,
    youtube
}

@Component({
    selector: 'os-video-player',
    templateUrl: './video-player.component.html',
    styleUrls: ['./video-player.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class VideoPlayerComponent implements OnDestroy, AfterViewInit {
    @ViewChild('vjs', { static: false })
    private vjsPlayerElementRef: ElementRef;

    private _videoUrl: string;

    @Input()
    public set videoUrl(value: string) {
        this._videoUrl = value.trim();
        this.playerType = this.determinePlayer(this.videoUrl);

        if (this.usingVjs) {
            this.mimeType = this.determineContentTypeByUrl(this.videoUrl);
            this.initVjs();
        } else if (this.usingYouTube) {
            this.stopVJS();
            this.unloadVjs();
            this.youTubeVideoId = this.getYouTubeVideoId(this.videoUrl);
        }
    }

    @Input()
    public showParticles: boolean;

    public get videoUrl(): string {
        return this._videoUrl;
    }

    public posterUrl: string;
    public vjsPlayer: videojs.Player;
    public youTubeVideoId: string;
    public isUrlOnline: boolean;
    private playerType: Player;
    private mimeType: MimeType;

    @Output()
    private started: EventEmitter<void> = new EventEmitter();

    public get usingYouTube(): boolean {
        return this.playerType === Player.youtube;
    }

    public get usingVjs(): boolean {
        return this.playerType === Player.vjs;
    }

    public get youTubeVideoUrl(): string {
        return `https://www.youtube.com/embed/${this.youTubeVideoId}?autoplay=1`;
    }

    public constructor(config: ConfigService) {
        config.get<string>('general_system_stream_poster').subscribe(posterUrl => {
            this.posterUrl = posterUrl?.trim();
        });
    }

    public ngAfterViewInit(): void {
        this.started.next();
    }

    public ngOnDestroy(): void {
        this.unloadVjs();
    }

    private stopVJS(): void {
        if (this.vjsPlayer) {
            this.vjsPlayer.src = '';
            this.vjsPlayer.pause();
        }
    }

    private unloadVjs(): void {
        if (this.vjsPlayer) {
            this.vjsPlayer.dispose();
            this.vjsPlayer = null;
        }
    }

    private async isUrlReachable(): Promise<void> {
        /**
         * Using observable would not make sense, because without it would not automatically update
         * if a Ressource switches from online to offline
         */
        const ajaxResponse: AjaxResponse = await ajax(this.videoUrl)
            .pipe(
                map(response => response),
                catchError(error => {
                    return of(error);
                })
            )
            .toPromise();

        /**
         * there is no enum for http status codes in the whole Angular stack...
         */
        if (ajaxResponse.status === 200) {
            this.isUrlOnline = true;
        } else {
            this.isUrlOnline = false;
        }
    }

    public async onRefreshVideo(): Promise<void> {
        await this.isUrlReachable();
        this.playVjsVideo();
    }

    private async initVjs(): Promise<void> {
        await this.isUrlReachable();

        if (!this.vjsPlayer && this.usingVjs && this.vjsPlayerElementRef) {
            this.vjsPlayer = videojs(this.vjsPlayerElementRef.nativeElement, {
                textTrackSettings: false,
                fluid: true,
                autoplay: 'any',
                liveui: true,
                poster: this.posterUrl
            });
        }
        this.playVjsVideo();
    }

    private playVjsVideo(): void {
        if (this.usingVjs && this.vjsPlayer && this.isUrlOnline) {
            this.vjsPlayer.src({
                src: this.videoUrl,
                type: this.mimeType
            });
        }
    }

    private determinePlayer(videoUrl: string): Player {
        if (videoUrl.includes('youtu.be') || videoUrl.includes('youtube.')) {
            return Player.youtube;
        } else {
            return Player.vjs;
        }
    }

    private getYouTubeVideoId(url: string): string {
        const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) {
            return match[2];
        }
    }

    private determineContentTypeByUrl(url: string): MimeType {
        if (url) {
            if (url.startsWith('rtmp')) {
                throw new Error(`$rtmp (flash) streams cannot be supported`);
            } else {
                const extension = url?.split('.')?.pop();
                const mimeType = MimeType[extension];
                if (mimeType) {
                    return mimeType;
                } else {
                    throw new Error(`${url} has an unknown mime type`);
                }
            }
        }
    }
}
