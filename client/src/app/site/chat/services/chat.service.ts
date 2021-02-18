import { Injectable } from '@angular/core';

import { BehaviorSubject, Observable } from 'rxjs';

import { ChatGroupRepositoryService } from '../../../core/repositories/chat/chat-group-repository.service';
import { ConstantsService } from '../../../core/core-services/constants.service';
import { OperatorService, Permission } from '../../../core/core-services/operator.service';

interface OpenSlidesSettings {
    ENABLE_CHAT: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class ChatService {
    private chatEnabled = false;
    private canSeeSomeChatGroup = false;
    private canManage = false;

    private canSeeChatSubject = new BehaviorSubject<boolean>(false);
    public get canSeeChatObservable(): Observable<boolean> {
        return this.canSeeChatSubject.asObservable();
    }

    public constructor(
        private repo: ChatGroupRepositoryService,
        private operator: OperatorService,
        private constantsService: ConstantsService
    ) {
        this.constantsService.get<OpenSlidesSettings>('Settings').subscribe(settings => {
            this.chatEnabled = settings.ENABLE_CHAT;
            this.update();
        });

        this.repo.getViewModelListBehaviorSubject().subscribe(groups => {
            this.canSeeSomeChatGroup = groups?.length > 0;
            this.update();
        });

        this.operator.getViewUserObservable().subscribe(() => {
            this.canManage = this.operator.hasPerms(Permission.chatCanManage);
            this.update();
        });
    }

    private update(): void {
        this.canSeeChatSubject.next(this.chatEnabled && (this.canSeeSomeChatGroup || this.canManage));
    }
}
