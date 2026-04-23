import { StorageService } from './storage.service'

const MIGRATION_KEY = '_migrated_from_keytar'
const SERVICE_NAME = 'ZoomChapterSplitter'

export async function migrateFromKeytar(storage: StorageService): Promise<void> {
  if (await storage.has(MIGRATION_KEY)) {
    return
  }

  try {
    const keytar = require('keytar')
    const credentials = await keytar.findCredentials(SERVICE_NAME)

    for (const { account, password } of credentials) {
      await storage.set(account, password)
      await keytar.deletePassword(SERVICE_NAME, account)
    }

    await storage.set(MIGRATION_KEY, 'true')
    console.log('Successfully migrated credentials from keytar to safeStorage')
  } catch {
    await storage.set(MIGRATION_KEY, 'true')
  }
}
