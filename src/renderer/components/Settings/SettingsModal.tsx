import { useState, useEffect } from 'react'
import { useAppStore } from '../../stores/appStore'

interface SettingsModalProps {
  onClose: () => void
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { llmSettings, updateLlmSettings } = useAppStore()
  const [openaiKey, setOpenaiKey] = useState('')
  const [anthropicKey, setAnthropicKey] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadKeys()
  }, [])

  const loadKeys = async () => {
    const openai = await window.electronAPI.keychain.get('openai')
    const anthropic = await window.electronAPI.keychain.get('anthropic')
    
    if (openai) {
      setOpenaiKey(maskKey(openai))
      updateLlmSettings({ hasOpenAiKey: true })
    }
    if (anthropic) {
      setAnthropicKey(maskKey(anthropic))
      updateLlmSettings({ hasAnthropicKey: true })
    }
  }

  const maskKey = (key: string): string => {
    if (key.length <= 8) return '••••••••'
    return key.slice(0, 4) + '••••••••' + key.slice(-4)
  }

  const handleSaveOpenAI = async () => {
    if (!openaiKey || openaiKey.includes('••••')) return
    
    setIsSaving(true)
    const success = await window.electronAPI.keychain.set('openai', openaiKey)
    if (success) {
      updateLlmSettings({ hasOpenAiKey: true })
      setOpenaiKey(maskKey(openaiKey))
    }
    setIsSaving(false)
  }

  const handleSaveAnthropic = async () => {
    if (!anthropicKey || anthropicKey.includes('••••')) return
    
    setIsSaving(true)
    const success = await window.electronAPI.keychain.set('anthropic', anthropicKey)
    if (success) {
      updateLlmSettings({ hasAnthropicKey: true })
      setAnthropicKey(maskKey(anthropicKey))
    }
    setIsSaving(false)
  }

  const handleDeleteOpenAI = async () => {
    if (!confirm('Remove OpenAI API key?')) return
    await window.electronAPI.keychain.delete('openai')
    setOpenaiKey('')
    updateLlmSettings({ hasOpenAiKey: false })
  }

  const handleDeleteAnthropic = async () => {
    if (!confirm('Remove Anthropic API key?')) return
    await window.electronAPI.keychain.delete('anthropic')
    setAnthropicKey('')
    updateLlmSettings({ hasAnthropicKey: false })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Settings</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="label">OpenAI API Key</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="password"
                className="input"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="sk-..."
              />
              {llmSettings.hasOpenAiKey ? (
                <button
                  className="btn btn-secondary"
                  onClick={handleDeleteOpenAI}
                  style={{ color: 'var(--color-error)' }}
                >
                  Remove
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={handleSaveOpenAI}
                  disabled={!openaiKey || openaiKey.includes('••••') || isSaving}
                >
                  Save
                </button>
              )}
            </div>
            <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
              Get your key from{' '}
              <a
                href="https://platform.openai.com/api-keys"
                style={{ color: 'var(--color-accent)' }}
                onClick={(e) => {
                  e.preventDefault()
                }}
              >
                platform.openai.com
              </a>
            </span>
          </div>

          <div className="form-group">
            <label className="label">Anthropic API Key</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="password"
                className="input"
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                placeholder="sk-ant-..."
              />
              {llmSettings.hasAnthropicKey ? (
                <button
                  className="btn btn-secondary"
                  onClick={handleDeleteAnthropic}
                  style={{ color: 'var(--color-error)' }}
                >
                  Remove
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={handleSaveAnthropic}
                  disabled={!anthropicKey || anthropicKey.includes('••••') || isSaving}
                >
                  Save
                </button>
              )}
            </div>
            <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
              Get your key from{' '}
              <a
                href="https://console.anthropic.com/account/keys"
                style={{ color: 'var(--color-accent)' }}
                onClick={(e) => {
                  e.preventDefault()
                }}
              >
                console.anthropic.com
              </a>
            </span>
          </div>

          <div className="form-group">
            <label className="label">Provider</label>
            <select
              className="input"
              value={llmSettings.provider}
              onChange={(e) =>
                updateLlmSettings({ provider: e.target.value as 'openai' | 'anthropic' })
              }
            >
              <option value="openai" disabled={!llmSettings.hasOpenAiKey}>
                OpenAI {!llmSettings.hasOpenAiKey && '- No key configured'}
              </option>
              <option value="anthropic" disabled={!llmSettings.hasAnthropicKey}>
                Anthropic {!llmSettings.hasAnthropicKey && '- No key configured'}
              </option>
            </select>
          </div>

          {llmSettings.provider === 'openai' && llmSettings.hasOpenAiKey && (
            <div className="form-group">
              <label className="label">OpenAI Model</label>
              <select
                className="input"
                value={llmSettings.openaiModel}
                onChange={(e) => updateLlmSettings({ openaiModel: e.target.value as any })}
              >
                <option value="gpt-4.1">GPT-4.1 (recommended)</option>
                <option value="gpt-4.1-mini">GPT-4.1 Mini (faster, cheaper)</option>
                <option value="gpt-4.1-nano">GPT-4.1 Nano (cheapest)</option>
                <option value="o3">o3 (reasoning)</option>
                <option value="o4-mini">o4 Mini (reasoning, faster)</option>
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
              </select>
            </div>
          )}

          {llmSettings.provider === 'anthropic' && llmSettings.hasAnthropicKey && (
            <div className="form-group">
              <label className="label">Anthropic Model</label>
              <select
                className="input"
                value={llmSettings.anthropicModel}
                onChange={(e) => updateLlmSettings({ anthropicModel: e.target.value as any })}
              >
                <option value="claude-sonnet-4-20250514">Claude Sonnet 4 (recommended)</option>
                <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (faster, cheaper)</option>
                <option value="claude-3-opus-20240229">Claude 3 Opus (most capable)</option>
              </select>
            </div>
          )}

          <div
            className="card"
            style={{
              background: 'var(--color-bg-tertiary)',
              padding: '16px',
              marginTop: '8px'
            }}
          >
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Your API keys are stored securely in your macOS Keychain and never sent anywhere
              except directly to the respective AI provider.
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
