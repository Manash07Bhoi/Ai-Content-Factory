import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CategorisationService {
  private readonly logger = new Logger(CategorisationService.name);

  scoreQuality(text: string, contentType: string): number {
    // This is a basic mock heuristic.
    // In a real application, this could involve a secondary LLM call or a trained ML model.
    let score = 50;

    if (!text || text.length < 10) return 0;

    // Length heuristics
    if (text.length > 50) score += 10;
    if (text.length > 200) score += 10;
    if (text.length > 500) score += 10;

    // Formatting heuristics (JSON structure, paragraph breaks, etc)
    if (text.includes('{') && text.includes('}')) score += 5;
    if (text.split('\\n').length > 2) score += 5;

    // Content specific checks
    if (contentType === 'scripts' && text.toLowerCase().includes('scene')) score += 10;
    if (contentType === 'posters' && text.toLowerCase().includes('lighting')) score += 10;
    if (contentType === 'prompts' && text.toLowerCase().includes('detailed')) score += 10;
    if (contentType === 'social' && text.includes('#')) score += 10;

    return Math.min(score, 100);
  }

  extractTags(text: string): string[] {
    const tags = new Set<string>();

    // Simple mock extraction: pull out hashtags or common keywords
    const hashTags = text.match(/#[a-zA-Z0-9_]+/g);
    if (hashTags) {
      hashTags.forEach(tag => tags.add(tag.replace('#', '').toLowerCase()));
    }

    const keywords = ['cinematic', 'minimalist', 'vibrant', 'cyberpunk', 'fantasy', 'scifi', 'business', 'marketing', 'tutorial'];
    keywords.forEach(kw => {
      if (text.toLowerCase().includes(kw)) {
        tags.add(kw);
      }
    });

    return Array.from(tags);
  }

  categorise(text: string): string {
    // Simple mock categorisation
    const textLower = text.toLowerCase();

    if (textLower.includes('business') || textLower.includes('marketing') || textLower.includes('sales')) {
      return 'Business & Marketing';
    }
    if (textLower.includes('art') || textLower.includes('cinematic') || textLower.includes('design')) {
      return 'Art & Design';
    }
    if (textLower.includes('code') || textLower.includes('software') || textLower.includes('tech')) {
      return 'Technology';
    }
    if (textLower.includes('story') || textLower.includes('script') || textLower.includes('character')) {
      return 'Entertainment & Storytelling';
    }

    return 'General';
  }
}
