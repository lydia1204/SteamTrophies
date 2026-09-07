import { StorageDriver, StorageEntry } from './driver';

export class MemoryStorageDriver implements StorageDriver {
  private readonly files = new Map<string, { text: string; modifiedAtUnix: number }>();

  async readText(relativePath: string): Promise<string | null> {
    return this.files.get(relativePath)?.text ?? null;
  }

  async writeTextAtomic(relativePath: string, text: string): Promise<void> {
    this.files.set(relativePath, { text, modifiedAtUnix: Math.floor(Date.now() / 1000) });
  }

  async appendText(relativePath: string, text: string): Promise<void> {
    const previous = this.files.get(relativePath)?.text ?? '';
    await this.writeTextAtomic(relativePath, previous + text);
  }

  async remove(relativePath: string): Promise<void> {
    this.files.delete(relativePath);
  }

  async list(prefix: string): Promise<StorageEntry[]> {
    return [...this.files.entries()]
      .filter(([path]) => path.startsWith(prefix))
      .map(([path, file]) => ({
        path,
        bytes: new TextEncoder().encode(file.text).byteLength,
        modifiedAtUnix: file.modifiedAtUnix,
      }));
  }

  dump(): ReadonlyMap<string, string> {
    return new Map([...this.files.entries()].map(([path, file]) => [path, file.text]));
  }
}
