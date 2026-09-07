import { STORAGE_KEYS } from '@/constants/config';
import type { Message, MessageKind } from '@/types';
import { matchService } from './matchService';
import { createId, storage } from './storage';

const PREVIEW_BY_KIND: Record<MessageKind, (body: string) => string> = {
  text: (body) => body,
  image: () => '📷 Photo',
  location: () => '📍 Location',
};

export const chatService = {
  async listMessages(matchId: string): Promise<Message[]> {
    const all = await storage.get<Message[]>(STORAGE_KEYS.messages, []);
    return all
      .filter((m) => m.matchId === matchId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },

  async sendMessage(
    matchId: string,
    senderId: string,
    kind: MessageKind,
    body: string,
  ): Promise<Message> {
    const all = await storage.get<Message[]>(STORAGE_KEYS.messages, []);

    const message: Message = {
      id: createId('msg'),
      matchId,
      senderId,
      kind,
      body,
      createdAt: new Date().toISOString(),
    };

    await storage.set(STORAGE_KEYS.messages, [...all, message]);
    await matchService.updateMatchPreview(matchId, PREVIEW_BY_KIND[kind](body));
    return message;
  },

  async listBlockedOwners(): Promise<string[]> {
    return storage.get<string[]>(STORAGE_KEYS.blocked, []);
  },

  async blockOwner(ownerId: string): Promise<void> {
    const blocked = await this.listBlockedOwners();
    if (blocked.includes(ownerId)) return;
    await storage.set(STORAGE_KEYS.blocked, [...blocked, ownerId]);
  },

  async unblockOwner(ownerId: string): Promise<void> {
    const blocked = await this.listBlockedOwners();
    await storage.set(
      STORAGE_KEYS.blocked,
      blocked.filter((id) => id !== ownerId),
    );
  },
};
