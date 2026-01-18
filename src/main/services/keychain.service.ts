import keytar from 'keytar'

const SERVICE_NAME = 'ZoomChapterSplitter'

export class KeychainService {
  async getKey(account: string): Promise<string | null> {
    try {
      return await keytar.getPassword(SERVICE_NAME, account)
    } catch (error) {
      console.error('Failed to get key from keychain:', error)
      return null
    }
  }

  async setKey(account: string, password: string): Promise<boolean> {
    try {
      await keytar.setPassword(SERVICE_NAME, account, password)
      return true
    } catch (error) {
      console.error('Failed to set key in keychain:', error)
      return false
    }
  }

  async deleteKey(account: string): Promise<boolean> {
    try {
      return await keytar.deletePassword(SERVICE_NAME, account)
    } catch (error) {
      console.error('Failed to delete key from keychain:', error)
      return false
    }
  }

  async hasKey(account: string): Promise<boolean> {
    const key = await this.getKey(account)
    return key !== null && key.length > 0
  }
}
