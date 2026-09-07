import type { GameSnapshot, TrophyEvent, TrophyTier } from '../../packages/core/src';
import { isQuietNow } from '../../packages/customization/src';
import { customizationService } from './customization-service';
import { trophyService } from './service';

export interface TrophyToastModel {
  id: string;
  appId: number;
  gameName: string;
  achievementId?: string;
  title: string;
  description: string;
  tier: TrophyTier;
  iconUrl: string | null;
  atUnix: number;
  test?: boolean;
}

type Listener = () => void;
const TIER_RANK: Record<TrophyTier, number> = { bronze: 1, silver: 2, gold: 3, platinum: 4 };

export class NotificationService {
  private queue: TrophyToastModel[] = [];
  private readonly listeners = new Set<Listener>();
  private readonly timers = new Map<string, number>();
  private unsubscribeEvents: (() => void) | null = null;
  private sequence = 0;
  private lastAudioAtMs = 0;

  getSnapshot = (): readonly TrophyToastModel[] => this.queue;
  subscribe = (listener: Listener): (() => void) => { this.listeners.add(listener); return () => this.listeners.delete(listener); };

  boot(): void {
    if (this.unsubscribeEvents) return;
    this.unsubscribeEvents = trophyService.subscribeEvents((events, game) => void this.onEvents(events, game));
  }

  dispose(): void {
    this.unsubscribeEvents?.();
    this.unsubscribeEvents = null;
    for (const timer of this.timers.values()) window.clearTimeout(timer);
    this.timers.clear();
    this.queue = [];
    this.emit();
  }

  dismiss(id: string): void {
    const timer = this.timers.get(id);
    if (timer !== undefined) window.clearTimeout(timer);
    this.timers.delete(id);
    const next = this.queue.filter((toast) => toast.id !== id);
    if (next.length !== this.queue.length) { this.queue = next; this.emit(); }
  }

  async test(tier: TrophyTier): Promise<void> {
    const toast: TrophyToastModel = {
      id: this.nextId(), appId: 0, gameName: 'SteamTrophies', title: tier === 'platinum' ? 'Platinum unlocked' : `${capitalize(tier)} trophy unlocked`,
      description: 'Notification preview. No achievement was changed.', tier, iconUrl: null, atUnix: Math.floor(Date.now() / 1000), test: true,
    };
    this.enqueue(toast);
    await this.playSound(tier, undefined, true);
  }

  private async onEvents(events: readonly TrophyEvent[], game: GameSnapshot): Promise<void> {
    const preferences = customizationService.getSnapshot().config.notifications;
    if (!preferences.enabled || isQuietNow(preferences)) return;

    const soundCandidates: TrophyTier[] = [];
    for (const event of events) {
      if (event.type === 'achievement_unlocked') {
        const achievement = game.achievements.find((row) => row.id === event.achievementId);
        if (!achievement) continue;
        this.enqueue({
          id: this.nextId(), appId: game.appId, gameName: game.name, achievementId: achievement.id,
          title: achievement.name || achievement.id, description: achievement.description || game.name,
          tier: event.tier, iconUrl: preferences.showAchievementArtwork ? achievement.iconUrl : null, atUnix: event.atUnix,
        });
        soundCandidates.push(event.tier);
      } else if (event.type === 'platinum_unlocked' && preferences.platinumCelebration) {
        this.enqueue({ id: this.nextId(), appId: game.appId, gameName: game.name, title: `${game.name} Platinum`, description: 'All Steam achievements completed.', tier: 'platinum', iconUrl: null, atUnix: event.atUnix });
        soundCandidates.push('platinum');
      }
    }

    // Preserve every visual/event record but collapse one Steam callback burst to its highest-tier sound.
    const highest = soundCandidates.sort((a, b) => TIER_RANK[b] - TIER_RANK[a])[0];
    if (highest) await this.playSound(highest, game.appId, false);
  }

  private enqueue(toast: TrophyToastModel): void {
    const preferences = customizationService.getSnapshot().config.notifications;
    const maxVisible = Math.max(1, Math.min(6, preferences.maxVisible));
    while (this.queue.length >= maxVisible) this.dismiss(this.queue[0].id);
    this.queue = [...this.queue, toast];
    this.emit();
    const timer = window.setTimeout(() => this.dismiss(toast.id), preferences.durationMs);
    this.timers.set(toast.id, timer);
  }

  private async playSound(tier: TrophyTier, appId?: number, force = false): Promise<void> {
    const preferences = customizationService.getSnapshot().config.notifications;
    if (!preferences.soundEnabled || preferences.volume <= 0 || isQuietNow(preferences)) return;
    const now = Date.now();
    if (!force && now - this.lastAudioAtMs < preferences.audioCooldownMs) return;
    try {
      const src = await customizationService.resolveToastSoundDataUrl(tier, appId);
      if (!src) return;
      const audio = new Audio(src);
      audio.volume = preferences.volume;
      await audio.play();
      this.lastAudioAtMs = now;
    } catch (error) {
      console.debug('[SteamTrophies] toast audio unavailable', error);
    }
  }

  private nextId(): string { this.sequence += 1; return `stt-toast-${Date.now()}-${this.sequence}`; }
  private emit(): void { for (const listener of this.listeners) listener(); }
}

function capitalize(value: string): string { return value.charAt(0).toUpperCase() + value.slice(1); }

export const notificationService = new NotificationService();
