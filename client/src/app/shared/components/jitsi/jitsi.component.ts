import { Component, ElementRef, HostListener, OnDestroy, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';

import { StorageMap } from '@ngx-pwa/local-storage';
import { TranslateService } from '@ngx-translate/core';
import { distinctUntilChanged } from 'rxjs/operators';

import { BaseComponent } from 'app/base.component';
import { ConstantsService } from 'app/core/core-services/constants.service';
import { OperatorService } from 'app/core/core-services/operator.service';
import { Deferred } from 'app/core/promises/deferred';
import { UserRepositoryService } from 'app/core/repositories/users/user-repository.service';
import { ConfigService } from 'app/core/ui-services/config.service';

declare var JitsiMeetExternalAPI: any;

interface JitsiMember {
    id: string;
    displayName: string;
}

interface ConferenceJoinedResult {
    roomName: string;
    id: string;
    displayName: string;
    formattedDisplayName: string;
}

interface DisplayNameChangeResult {
    // Yes, in this case "displayname" really does not have a capital n. Thank you jitsi.
    displayname: string;
    formattedDisplayName: string;
    id: string;
}

interface JitsiSettings {
    JITSI_DOMAIN: string;
    JITSI_ROOM_NAME: string;
    JITSI_ROOM_PASSWORD: string;
}

interface ConferenceMember {
    name: string;
    focus: boolean;
}

@Component({
    selector: 'os-jitsi',
    templateUrl: './jitsi.component.html',
    styleUrls: ['./jitsi.component.scss']
})
export class JitsiComponent extends BaseComponent implements OnDestroy {
    public enableJitsi: boolean;
    private autoconnect: boolean;
    private roomName: string;
    private roomPassword: string;
    private jitsiDomain: string;

    // do not set the password twice
    private isPasswortSet = false;

    public showJitsiWindow = false;
    public muted = true;

    @ViewChild('jitsi')
    private jitsiNode: ElementRef;

    // JitsiMeet api object
    private api: any | null;

    public get isJitsiActive(): boolean {
        return !!this.api;
    }

    public isJoined: boolean;

    private options: object;

    private lockLoaded: Deferred<void> = new Deferred();
    private constantsLoaded: Deferred<void> = new Deferred();

    // storage locks
    public isJitsiActiveInAnotherTab: boolean;
    private RTC_LOGGED_STORAGE_KEY = 'rtcIsLoggedIn';

    // JitsiID to ConferenceMember
    public members = {};
    public currentDominantSpeaker: JitsiMember;

    public get memberList(): string[] {
        return Object.keys(this.members);
    }

    public get isRoomPasswordProtected(): boolean {
        return this.roomPassword?.length > 0;
    }

    private configOverwrite = {
        startAudioOnly: true,
        // allows jitsi on mobile devices
        disableDeepLinking: true,
        startWithAudioMuted: true,
        startWithVideoMuted: true,
        useNicks: true,
        enableWelcomePage: false,
        enableUserRolesBasedOnToken: false,
        enableFeaturesBasedOnToken: false,
        disableThirdPartyRequests: true,
        enableNoAudioDetection: false,
        enableNoisyMicDetection: false
    };

    private interfaceConfigOverwrite = {
        filmStripOnly: true,
        INITIAL_TOOLBAR_TIMEOUT: 2000,
        TOOLBAR_TIMEOUT: 400,
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        INVITATION_POWERED_BY: false,
        DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
        TOOLBAR_BUTTONS: [],
        SETTINGS_SECTIONS: []
    };

    public constructor(
        titleService: Title,
        translate: TranslateService,
        private operator: OperatorService,
        private storageMap: StorageMap,
        private userRepo: UserRepositoryService,
        private constantsService: ConstantsService,
        private configService: ConfigService
    ) {
        super(titleService, translate);
        this.setUp();
    }

    public ngOnDestroy(): void {
        this.stopJitsi();
    }

    // closing the tab should also try to stop jitsi.
    // this will usually not be cought by ngOnDestroy
    @HostListener('window:beforeunload', ['$event'])
    public async beforeunload($event: any): Promise<void> {
        await this.stopJitsi();
    }

    private async setUp(): Promise<void> {
        this.storageMap
            .watch(this.RTC_LOGGED_STORAGE_KEY)
            .pipe(distinctUntilChanged())
            .subscribe((inUse: boolean) => {
                this.isJitsiActiveInAnotherTab = inUse;
                this.lockLoaded.resolve();
                if (!inUse && !this.isJitsiActive) {
                    this.startJitsi();
                }
            });

        await this.lockLoaded;
        this.constantsService.get<JitsiSettings>('Settings').subscribe(settings => {
            if (settings) {
                this.jitsiDomain = settings.JITSI_DOMAIN;
                this.roomName = settings.JITSI_ROOM_NAME;
                this.roomPassword = settings.JITSI_ROOM_PASSWORD;
                this.constantsLoaded.resolve();
            }
        });

        await this.constantsLoaded;
        this.configService
            .get<boolean>('general_system_conference_show')
            .subscribe(autoconnect => (this.autoconnect = autoconnect));

        this.configService.get<boolean>('general_system_conference_auto_connect').subscribe(show => {
            this.enableJitsi = show && !!this.jitsiDomain && !!this.roomName;
            if (this.enableJitsi && this.autoconnect) {
                this.startJitsi();
            } else {
                this.stopJitsi();
            }
        });
    }

    public toggleMute(): void {
        if (this.isJitsiActive) {
            this.api.executeCommand('toggleAudio');
        }
    }

    public async forceStart(): Promise<void> {
        await this.deleteJitsiLock();
        await this.stopJitsi();
        await this.startJitsi();
    }

    private startJitsi(): void {
        if (!this.isJitsiActiveInAnotherTab && this.enableJitsi && !this.isJitsiActive && this.jitsiNode) {
            this.enterConversation();
        }
    }

    public async enterConversation(): Promise<void> {
        await this.operator.loaded;
        this.storageMap.set(this.RTC_LOGGED_STORAGE_KEY, true).subscribe(() => {});
        this.setOptions();
        this.api = new JitsiMeetExternalAPI(this.jitsiDomain, this.options);

        const jitsiname = this.userRepo.getShortName(this.operator.user);
        this.api.executeCommand('displayName', jitsiname);
        this.loadApiCallbacks();
    }

    private loadApiCallbacks(): void {
        this.api.on('videoConferenceJoined', (info: ConferenceJoinedResult) => {
            this.onEnterConference(info);
        });

        this.api.on('participantJoined', (newMember: JitsiMember) => {
            this.addMember(newMember);
        });

        this.api.on('participantLeft', (oldMember: { id: string }) => {
            this.removeMember(oldMember);
        });

        this.api.on('displayNameChange', (member: DisplayNameChangeResult) => {
            this.renameMember(member);
        });

        this.api.on('audioMuteStatusChanged', (isMuted: { muted: boolean }) => {
            this.muted = isMuted.muted;
        });

        this.api.on('readyToClose', () => {
            this.stopJitsi();
        });

        this.api.on('dominantSpeakerChanged', (newSpeaker: { id: string }) => {
            this.newDominantSpeaker(newSpeaker.id);
        });

        this.api.on('passwordRequired', () => {
            this.setRoomPassword();
        });
    }

    private onEnterConference(info: ConferenceJoinedResult): void {
        this.isJoined = true;
        this.addMember({ displayName: info.displayName, id: info.id });
        this.setRoomPassword();
    }

    private setRoomPassword(): void {
        if (this.roomPassword && !this.isPasswortSet) {
            // You can only set the password after the server has recognized that you are
            // the moderator. There is no event listener for that.
            setTimeout(() => {
                this.api.executeCommand('password', this.roomPassword);
                this.isPasswortSet = true;
            }, 1000);
        }
    }

    private newDominantSpeaker(newSpeakerId: string): void {
        if (this.currentDominantSpeaker && this.members[this.currentDominantSpeaker.id]) {
            this.members[this.currentDominantSpeaker.id].focus = false;
        }
        this.members[newSpeakerId].focus = true;
        this.currentDominantSpeaker = {
            id: newSpeakerId,
            displayName: this.members[newSpeakerId].name
        };
    }

    private addMember(newMember: JitsiMember): void {
        this.members[newMember.id] = {
            name: newMember.displayName,
            focus: false
        } as ConferenceMember;
    }

    private removeMember(oldMember: { id: string }): void {
        if (this.members[oldMember.id]) {
            delete this.members[oldMember.id];
        }
    }

    private renameMember(member: DisplayNameChangeResult): void {
        if (this.members[member.id]) {
            this.members[member.id].name = member.displayname;
        }
        if (this.currentDominantSpeaker?.id === member.id) {
            this.newDominantSpeaker(member.id);
        }
    }

    private clearMembers(): void {
        this.members = {};
    }

    public async stopJitsi(): Promise<void> {
        if (this.isJitsiActive) {
            this.api.executeCommand('hangup');
            this.clearMembers();
            await this.deleteJitsiLock();
            this.api.dispose();
            this.api = undefined;
        }
        this.isJoined = false;
        this.isPasswortSet = false;
        this.currentDominantSpeaker = null;
    }

    private setOptions(): void {
        this.options = {
            roomName: this.roomName,
            parentNode: this.jitsiNode.nativeElement,
            configOverwrite: this.configOverwrite,
            interfaceConfigOverwrite: this.interfaceConfigOverwrite
        };
    }

    public toggleShowJitsi(): void {
        this.showJitsiWindow = !this.showJitsiWindow;
    }

    private getJitsiMeetUrl(): string {
        return `https://${this.jitsiDomain}/${this.roomName}`;
    }

    public openExternal(): void {
        this.stopJitsi();
        window.open(this.getJitsiMeetUrl(), '_blank');
    }

    private async deleteJitsiLock(): Promise<void> {
        await this.storageMap.delete(this.RTC_LOGGED_STORAGE_KEY).toPromise();
    }
}
