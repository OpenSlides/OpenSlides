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
    @ViewChild('videoPlayer', { static: true }) private videoPlayer: ElementRef;

    private _videoUrl: string;

    @Input()
    public set videoUrl(value: string) {
        this._videoUrl = value;
        this.playVideo();
    }

    @Output()
    private started: EventEmitter<void> = new EventEmitter();

    public get videoUrl(): string {
        return this._videoUrl;
    }

    public player: videojs.Player;

    private get videoSource(): VideoSource {
        return {
            src: this.videoUrl,
            type: this.determineContentTypeByUrl(this.videoUrl)
        };
    }

    private posterUrl: string;

    public constructor(config: ConfigService) {
        config.get<string>('general_system_stream_poster').subscribe(posterUrl => {
            this.posterUrl = posterUrl;
        });
    }

    public async ngOnInit(): Promise<void> {
        this.player = videojs(this.videoPlayer.nativeElement, {
            textTrackSettings: false,
            fluid: true,
            autoplay: 'any',
            liveui: true,
            poster: this.posterUrl
        });
        this.playVideo();
    }

    public ngOnDestroy(): void {
        if (this.player) {
            this.player.dispose();
        }
    }

    private playVideo(): void {
        if (this.player) {
            this.player.src(this.videoSource);
            this.started.next();
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
