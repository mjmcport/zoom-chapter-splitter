import { safeStorage, app } from 'electron'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

interface EncryptedStore {
  [key: string]: string
}

export class StorageService {
  private storePath: string
  private store: EncryptedStore = {}

  constructor() {
    this.storePath = join(app.getPath('userData'), 'secure-storage.json')
    this.load()
  }

  private load(): void {
    if (existsSync(this.storePath)) {
      try {
        const data = readFileSync(this.storePath, 'utf-8')
        this.store = JSON.parse(data)
      } catch {
        this.store = {}
      }
    }
  }

  private save(): void {
    writeFileSync(this.storePath, JSON.stringify(this.store, null, 2))
  }

  async get(key: string): Promise<string | null> {
    if (!safeStorage.isEncryptionAvailable()) {
      console.warn('Encryption not available')
      return null
    }

    const encrypted = this.store[key]
    if (!encrypted) return null

    try {
      const buffer = Buffer.from(encrypted, 'base64')
      return safeStorage.decryptString(buffer)
    } catch {
      return null
    }
  }

  async set(key: string, value: string): Promise<boolean> {
    if (!safeStorage.isEncryptionAvailable()) {
      console.warn('Encryption not available')
      return false
    }

    try {
      const encrypted = safeStorage.encryptString(value)
      this.store[key] = encrypted.toString('base64')
      this.save()
      return true
    } catch {
      return false
    }
  }

  async delete(key: string): Promise<boolean> {
    if (this.store[key]) {
      delete this.store[key]
      this.save()
      return true
    }
    return false
  }

  async has(key: string): Promise<boolean> {
    return key in this.store
  }
}
