import { app, BrowserWindow, protocol, net } from 'electron'
import { join } from 'path'
import { registerIpcHandlers } from './ipc-handlers'
import { StorageService } from './services/storage.service'
import { migrateFromKeytar } from './services/migration.service'

protocol.registerSchemesAsPrivileged([
  { scheme: 'media', privileges: { stream: true, bypassCSP: true, supportFetchAPI: true } }
])

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#0a0a0f',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  })

  protocol.handle('media', (request) => {
    const filePath = decodeURIComponent(request.url.replace('media://', ''))
    return net.fetch(`file://${filePath}`)
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5180')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(async () => {
  const storage = new StorageService()
  await migrateFromKeytar(storage)
  
  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

export { mainWindow }
