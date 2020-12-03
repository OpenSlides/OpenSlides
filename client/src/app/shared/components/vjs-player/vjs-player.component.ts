import {
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

interface VideoSource {
    src: string;
    type: MimeType;
}

enum MimeType {
    mp4 = 'video/mp4',
    mpd = 'application/dash+xml',
    m3u8 = 'application/x-mpegURL'
}

@Component({
    selector: 'os-vjs-player',
    templateUrl: './vjs-player.component.html',
    styleUrls: ['./vjs-player.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class VjsPlayerComponent implements OnInit, OnDestroy {
    @ViewChild('videoPlayer', { static: true })
    private videoPlayer: ElementRef;
    private _videoUrl: string;
    public posterUrl: string;
    public player: videojs.Player;
    public isUrlOnline: boolean;

    @Input()
    public set videoUrl(value: string) {
        this._videoUrl = value.trim();
        this.checkVideoUrl();
    }

    @Output()
    private started: EventEmitter<void> = new EventEmitter();

    public get videoUrl(): string {
        return this._videoUrl;
    }

    private get videoSource(): VideoSource {
        return {
            src: this.videoUrl,
            type: this.determineContentTypeByUrl(this.videoUrl)
        };
    }

    public constructor(config: ConfigService) {
        config.get<string>('general_system_stream_poster').subscribe(posterUrl => {
            this.posterUrl = posterUrl?.trim();
        });
    }

    public async ngOnInit(): Promise<void> {
        this.initPlayer();
    }

    public ngOnDestroy(): void {
        if (this.player) {
            this.player.dispose();
        }
    }

    public async checkVideoUrl(): Promise<void> {
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
            this.playVideo();
        } else {
            this.isUrlOnline = false;
            if (this.player) {
                this.player.pause();
            }
            this.player.src('');
        }
    }

    private initPlayer(): void {
        if (!this.player) {
            this.player = videojs(this.videoPlayer.nativeElement, {
                textTrackSettings: false,
                fluid: true,
                autoplay: 'any',
                liveui: true,
                poster: this.posterUrl
            });
        }
    }

    private playVideo(): void {
        this.player.src(this.videoSource);
        this.started.next();
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
