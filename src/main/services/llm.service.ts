import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { KeychainService } from './keychain.service'

export interface ChapterSuggestion {
  title: string
  startTime: number
  endTime: number
  confidence: number
  summary: string
}

export interface ChapterDetectionResult {
  chapters: ChapterSuggestion[]
  processingTime: number
}

type ProgressCallback = (progress: { stage: string; percent: number }) => void

export class LlmService {
  constructor(private keychainService: KeychainService) {}

  async detectChapters(
    transcript: string,
    provider: 'openai' | 'anthropic',
    model: string,
    onProgress?: ProgressCallback
  ): Promise<ChapterDetectionResult> {
    const startTime = Date.now()
    
    onProgress?.({ stage: 'Preparing transcript', percent: 10 })
    
    const chunks = this.chunkTranscript(transcript)
    const allSuggestions: ChapterSuggestion[] = []
    
    for (let i = 0; i < chunks.length; i++) {
      onProgress?.({ 
        stage: `Analyzing chunk ${i + 1}/${chunks.length}`, 
        percent: 20 + (60 * i / chunks.length) 
      })
      
      const suggestions = provider === 'openai'
        ? await this.analyzeWithOpenAI(chunks[i], model)
        : await this.analyzeWithAnthropic(chunks[i], model)
      
      allSuggestions.push(...suggestions)
    }
    
    onProgress?.({ stage: 'Synthesizing chapters', percent: 85 })
    const finalChapters = this.mergeOverlappingChapters(allSuggestions)
    
    onProgress?.({ stage: 'Complete', percent: 100 })
    
    return {
      chapters: finalChapters,
      processingTime: Date.now() - startTime
    }
  }

  private chunkTranscript(transcript: string, maxChars = 60000): string[] {
    const lines = transcript.split('\n')
    const chunks: string[] = []
    let currentChunk: string[] = []
    let currentChunkSize = 0
    
    for (const line of lines) {
      const lineSize = line.length + 1
      
      if (currentChunkSize + lineSize > maxChars && currentChunk.length > 0) {
        chunks.push(currentChunk.join('\n'))
        currentChunk = []
        currentChunkSize = 0
      }
      
      currentChunk.push(line)
      currentChunkSize += lineSize
    }
    
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join('\n'))
    }
    
    return chunks.length > 0 ? chunks : [transcript]
  }

  private async analyzeWithOpenAI(chunk: string, model: string): Promise<ChapterSuggestion[]> {
    const apiKey = await this.keychainService.getKey('openai')
    if (!apiKey) throw new Error('OpenAI API key not configured')
    
    const client = new OpenAI({ apiKey })
    
    const isReasoningModel = model.startsWith('o3') || model.startsWith('o4')
    
    const response = await client.chat.completions.create({
      model,
      ...(isReasoningModel ? {} : { response_format: { type: 'json_object' as const } }),
      messages: isReasoningModel
        ? [{ role: 'user', content: `${this.getSystemPrompt()}\n\nTranscript:\n${chunk}` }]
        : [
            { role: 'system', content: this.getSystemPrompt() },
            { role: 'user', content: chunk }
          ]
    })
    
    const content = response.choices[0]?.message?.content
    if (!content) return []
    
    return this.parseResponse(content)
  }

  private async analyzeWithAnthropic(chunk: string, model: string): Promise<ChapterSuggestion[]> {
    const apiKey = await this.keychainService.getKey('anthropic')
    if (!apiKey) throw new Error('Anthropic API key not configured')
    
    const client = new Anthropic({ apiKey })
    
    const response = await client.messages.create({
      model,
      max_tokens: 4096,
      system: this.getSystemPrompt(),
      messages: [{ role: 'user', content: chunk }]
    })
    
    const textBlock = response.content.find(block => block.type === 'text')
    if (!textBlock || textBlock.type !== 'text') return []
    
    return this.parseResponse(textBlock.text)
  }

  private getSystemPrompt(): string {
    return `You are an expert at analyzing meeting transcripts and identifying natural chapter breaks.

Analyze the provided transcript and identify distinct topics, segments, or chapters.

For each chapter, provide:
- title: A concise, descriptive title (3-7 words)
- startTime: Start time in seconds (based on the timestamps in the transcript)
- endTime: End time in seconds
- confidence: Your confidence in this chapter break (0.0 to 1.0)
- summary: A brief 1-sentence summary of the chapter content

Return your response as a JSON object with a "chapters" array:
{
  "chapters": [
    {
      "title": "Introduction and Welcome",
      "startTime": 0,
      "endTime": 180,
      "confidence": 0.95,
      "summary": "Host welcomes attendees and outlines the agenda."
    }
  ]
}

Guidelines:
- Identify 3-10 chapters for a typical 1-hour meeting
- Each chapter should be at least 2 minutes long
- Look for topic changes, speaker transitions, and natural breaks
- Use timestamps from the transcript to determine timing`
  }

  private parseResponse(content: string): ChapterSuggestion[] {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) return []
      
      const parsed = JSON.parse(jsonMatch[0])
      return parsed.chapters || []
    } catch {
      return []
    }
  }

  private mergeOverlappingChapters(chapters: ChapterSuggestion[]): ChapterSuggestion[] {
    if (chapters.length === 0) return []
    
    const sorted = [...chapters].sort((a, b) => a.startTime - b.startTime)
    const merged: ChapterSuggestion[] = [sorted[0]]
    
    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i]
      const previous = merged[merged.length - 1]
      
      const overlap = previous.endTime - current.startTime
      if (overlap > 30) {
        if (current.confidence > previous.confidence) {
          previous.endTime = current.startTime
        } else {
          current.startTime = previous.endTime
        }
      }
      
      if (current.endTime - current.startTime >= 60) {
        merged.push(current)
      }
    }
    
    return merged.map(chapter => ({
      ...chapter,
      startTime: Math.max(0, chapter.startTime - 3)
    }))
  }
}
