import webvtt from 'node-webvtt'

export interface TranscriptCue {
  id: string
  startTime: number
  endTime: number
  text: string
  speaker?: string
}

export interface ParsedTranscript {
  cues: TranscriptCue[]
  duration: number
  rawText: string
}

export class VttParserService {
  parse(vttContent: string): ParsedTranscript {
    const parsed = webvtt.parse(vttContent)
    
    const cues: TranscriptCue[] = parsed.cues.map((cue: any, index: number) => {
      // Zoom VTT format often includes speaker names like "Speaker Name: text"
      const { speaker, text } = this.extractSpeaker(cue.text)
      
      return {
        id: cue.identifier || `cue-${index}`,
        startTime: cue.start,
        endTime: cue.end,
        text: text.trim(),
        speaker
      }
    })

    const duration = cues.length > 0 ? cues[cues.length - 1].endTime : 0
    const rawText = cues.map(c => c.text).join(' ')

    return { cues, duration, rawText }
  }

  private extractSpeaker(text: string): { speaker?: string; text: string } {
    // Common Zoom VTT pattern: "Speaker Name: dialogue text"
    const speakerMatch = text.match(/^([^:]+):\s*(.*)$/s)
    
    if (speakerMatch && speakerMatch[1].length < 50) {
      return {
        speaker: speakerMatch[1].trim(),
        text: speakerMatch[2]
      }
    }
    
    return { text }
  }

  // Format transcript for LLM consumption
  formatForLlm(cues: TranscriptCue[]): string {
    return cues.map(cue => {
      const timestamp = this.formatTimestamp(cue.startTime)
      const speaker = cue.speaker ? `[${cue.speaker}]` : ''
      return `[${timestamp}] ${speaker} ${cue.text}`
    }).join('\n')
  }

  private formatTimestamp(seconds: number): string {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    return `${m}:${s.toString().padStart(2, '0')}`
  }
}
