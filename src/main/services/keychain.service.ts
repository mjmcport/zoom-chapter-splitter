import { StorageService } from './storage.service'

export class KeychainService {
  private storage: StorageService

  constructor() {
    this.storage = new StorageService()
  }

  async getKey(account: string): Promise<string | null> {
    try {
      return await this.storage.get(account)
    } catch (error) {
      console.error('Failed to get key from storage:', error)
      return null
    }
  }

  async setKey(account: string, password: string): Promise<boolean> {
    try {
      return await this.storage.set(account, password)
    } catch (error) {
      console.error('Failed to set key in storage:', error)
      return false
    }
  }

  async deleteKey(account: string): Promise<boolean> {
    try {
      return await this.storage.delete(account)
    } catch (error) {
      console.error('Failed to delete key from storage:', error)
      return false
    }
  }

  async hasKey(account: string): Promise<boolean> {
    const key = await this.getKey(account)
    return key !== null && key.length > 0
  }
}
