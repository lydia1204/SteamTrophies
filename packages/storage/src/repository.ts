import { GameSnapshot, LibraryIndex, TrophyEvent } from '../../core/src/model';
import { decodeGameSnapshot, decodeLibraryIndex, encodeEvent, encodeJson } from './codec';
import { StorageDriver } from './driver';
import { gamePath, INDEX_PATH, monthlyEventPath } from './paths';

export interface TrophyRepository {
  readIndex(): Promise<LibraryIndex | null>;
  writeIndex(index: LibraryIndex): Promise<void>;
  readGame(appId: number): Promise<GameSnapshot | null>;
  writeGame(game: GameSnapshot): Promise<void>;
  appendEvents(events: readonly TrophyEvent[]): Promise<void>;
}

export class ShardRepository implements TrophyRepository {
  constructor(private readonly driver: StorageDriver) {}

  async readIndex(): Promise<LibraryIndex | null> {
    const text = await this.driver.readText(INDEX_PATH);
    return text == null ? null : decodeLibraryIndex(text, INDEX_PATH);
  }

  writeIndex(index: LibraryIndex): Promise<void> {
    return this.driver.writeTextAtomic(INDEX_PATH, encodeJson(index));
  }

  async readGame(appId: number): Promise<GameSnapshot | null> {
    const path = gamePath(appId);
    const text = await this.driver.readText(path);
    return text == null ? null : decodeGameSnapshot(text, path);
  }

  writeGame(game: GameSnapshot): Promise<void> {
    return this.driver.writeTextAtomic(gamePath(game.appId), encodeJson(game));
  }

  async appendEvents(events: readonly TrophyEvent[]): Promise<void> {
    const grouped = new Map<string, TrophyEvent[]>();
    for (const event of events) {
      const path = monthlyEventPath(event.atUnix);
      const bucket = grouped.get(path) ?? [];
      bucket.push(event);
      grouped.set(path, bucket);
    }
    await Promise.all(
      [...grouped.entries()].map(([path, bucket]) => this.driver.appendText(path, bucket.map(encodeEvent).join(''))),
    );
  }
}
