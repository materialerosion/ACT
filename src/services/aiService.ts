import OpenAI from 'openai';
import type { ChatCompletionContentPart } from 'openai/resources/chat/completions';
import { ConsumerProfile, DemographicInput, PreferenceAnalysis, Concept, Question } from '@/types';
import getConfig from 'next/config';

const { serverRuntimeConfig } = getConfig();

const openai = new OpenAI({
  baseURL: serverRuntimeConfig.bayerApiUrl,
  apiKey: serverRuntimeConfig.bayerApiKey,
});

export class AIService {
  // Helper function to extract JSON from AI responses that may be wrapped in markdown
  private static extractJsonFromResponse(content: string): string {
    // Remove markdown code blocks if present
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      return jsonMatch[1].trim();
    }
    
    // If no code blocks, return the content as-is
    return content.trim();
  }

  static async generateConsumerProfiles(demographics: DemographicInput, count: number = 100): Promise<ConsumerProfile[]> {
    console.log('🤖 [DEBUG] Using AI SERVICE for profile generation');
    console.log(`🤖 [DEBUG] Generating ${count} AI profiles with demographics:`, demographics);
    
    const profiles: ConsumerProfile[] = [];
    const batchSize = 10; // Reduced batch size to prevent token limit issues with larger profile counts
    let conversationHistory: Array<{role: 'system' | 'user' | 'assistant', content: string}> = [];
    
    // Build additional context string
    let additionalContextString = '';
    if (demographics.additionalContext) {
      additionalContextString += `\n\nADDITIONAL CONTEXT:\n${demographics.additionalContext}`;
    }
    if (demographics.uploadedFiles && demographics.uploadedFiles.length > 0) {
      additionalContextString += '\n\nUPLOADED RESEARCH DOCUMENTS:\n';
      demographics.uploadedFiles.forEach(file => {
        additionalContextString += `\n--- ${file.name} ---\n${file.content.substring(0, 2000)}\n`; // Limit content length
      });
    }
    
    // Process in batches
    for (let i = 0; i < count; i += batchSize) {
      const currentBatchSize = Math.min(batchSize, count - i);
      const isFirstBatch = i === 0;
      
      let prompt: string;
      
      if (isFirstBatch) {
        const ageRange = demographics.ageMin && demographics.ageMax 
          ? `${demographics.ageMin}-${demographics.ageMax}` 
          : demographics.ageRanges.join(', ');
        const incomeRange = demographics.incomeMin !== undefined && demographics.incomeMax !== undefined
          ? `$${demographics.incomeMin.toLocaleString()} - $${demographics.incomeMax.toLocaleString()}`
          : demographics.incomeRanges.join(', ');
        
        prompt = `Generate exactly ${currentBatchSize} diverse consumer profiles based on the following demographics:
        
        Age Range: ${ageRange}
        Genders: ${demographics.genders.join(', ')}
        Locations: ${demographics.locations.join(', ')}
        Income Range: ${incomeRange}
        Education Levels: ${demographics.educationLevels.join(', ')}
        ${additionalContextString}
        
        For each profile, provide realistic and diverse characteristics including:
        - Unique lifestyle descriptions including family situation, occupation, daily habits
        - 2-4 interests/hobbies
        - Shopping behavior patterns
        - Technology adoption level (Low/Medium/High/Very High)
        - Environmental awareness level (Low/Medium/High/Very High)
        - Brand loyalty tendencies (Low/Medium/High/Very High)
        - Price sensitivity (Low/Medium/High/Very High)
        - Name (ensure realistic and diverse first and last names that fit the demographic, avoid placeholder names like John Doe)
        
        Return ONLY a valid JSON array with exactly ${currentBatchSize} profiles. Each profile must have this exact structure:
        [
          {
            "id": "unique_id_string",
            "name": "realistic_first_and_last_name",
            "age": number,
            "gender": "string",
            "location": "string", 
            "income": "string",
            "education": "string",
            "lifestyle": "string",
            "interests": ["interest1", "interest2"],
            "shoppingBehavior": "string",
            "techSavviness": "string",
            "environmentalAwareness": "string",
            "brandLoyalty": "string",
            "pricesensitivity": "string"
          }
        ]
        
        Ensure variety and realism. Each profile should be unique and realistic.`
        
        conversationHistory = [
          {
            role: 'system',
            content: 'You are an expert consumer research analyst. Generate realistic and diverse consumer profiles based on demographic inputs. IMPORTANT: Respond with valid JSON only - no markdown code blocks, no explanations, just a pure JSON array. When asked to continue, generate more profiles following the same format and demographic constraints, ensuring variety and no duplicates.'
          },
          {
            role: 'user',
            content: prompt
          }
        ];
      } else {
        prompt = `continue - generate exactly ${currentBatchSize} more diverse consumer profiles following the same format and demographic constraints. Ensure they are different from previous profiles and maintain variety.`
        
        conversationHistory.push({
          role: 'user',
          content: prompt
        });
      }

      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: conversationHistory,
          max_completion_tokens: 6000
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
          console.warn(`No response from AI service for batch ${i / batchSize + 1}`);
          continue;
        }

        const cleanedContent = this.extractJsonFromResponse(content);
        
        try {
          const batchProfiles: ConsumerProfile[] = JSON.parse(cleanedContent);
          
          if (Array.isArray(batchProfiles) && batchProfiles.length > 0) {
            profiles.push(...batchProfiles);
            console.log(`Successfully generated ${batchProfiles.length} profiles in batch ${i / batchSize + 1}`);
            
            conversationHistory.push({
              role: 'assistant',
              content: cleanedContent
            });
            
            if (conversationHistory.length > 5) {
              conversationHistory = [
                conversationHistory[0], // Keep system message
                ...conversationHistory.slice(-4) // Keep last 4 messages (2 exchanges)
              ];
            }
          } else {
            console.warn(`Invalid profile data format in batch ${i / batchSize + 1}`);
          }
        } catch (parseError) {
          console.error(`Failed to parse AI response for batch ${i / batchSize + 1}:`, parseError);
          console.error('Raw content:', content);
          console.error('Cleaned content:', cleanedContent);
        }
      } catch (error) {
        console.error(`Error generating profiles for batch ${i / batchSize + 1}:`, error);
      }
    }

    if (profiles.length > 0) {
      console.log(`Successfully generated ${profiles.length} total profiles`);
      return profiles.slice(0, count); // Ensure we don't exceed the requested count
    } else {
      throw new Error('Failed to generate consumer profiles');
    }
  }

  // Build type-specific instructions for each question type
  private static getTypeInstructions(type: string): string {
    switch (type) {
      case 'scale_1_5':
        return 'Respond with an integer from 1 (lowest) to 5 (highest)';
      case 'scale_1_10':
        return 'Respond with an integer from 1 (lowest) to 10 (highest)';
      case 'open_ended':
        return 'Respond with 1-3 sentences from the consumer\'s first-person perspective';
      case 'rank_order':
        return 'Respond with an array of concept IDs in preference order (most preferred first)';
      default:
        return 'Respond appropriately';
    }
  }

  // Build the expected JSON value type for the example
  private static getTypeExample(type: string): string {
    switch (type) {
      case 'scale_1_5':
        return '3';
      case 'scale_1_10':
        return '7';
      case 'open_ended':
        return '"I think this product..."';
      case 'rank_order':
        return '["concept_id_1", "concept_id_2"]';
      default:
        return '"response"';
    }
  }

  // Build multimodal message content for vision API
  private static buildUserMessageContent(promptText: string, concept: Concept): string | ChatCompletionContentPart[] {
    if (concept.imageBase64 && concept.imageMimeType) {
      // Multimodal message with image
      const parts: ChatCompletionContentPart[] = [
        { type: 'text' as const, text: promptText },
        {
          type: 'image_url' as const,
          image_url: {
            url: `data:${concept.imageMimeType};base64,${concept.imageBase64}`,
            detail: 'low' as const
          }
        }
      ];
      return parts;
    }
    // Text-only message
    return promptText;
  }

  static async analyzePreferences(
    profiles: ConsumerProfile[], 
    concepts: Concept[],
    questions: Question[]
  ): Promise<PreferenceAnalysis[]> {
    console.log('🤖 [DEBUG] Using AI SERVICE for preference analysis');
    console.log(`🤖 [DEBUG] Analyzing ${profiles.length} profiles against ${concepts.length} concepts and ${questions.length} questions using AI`);
    
    const analyses: PreferenceAnalysis[] = [];
    const startTime = Date.now();
    
    const models = ['grok-3', 'gpt-4o-mini', 'gpt-5-nano', 'claude-sonnet-4'];
    const batchSize = 5;
    
    // Build the survey questions section once (shared across all batches)
    const surveyQuestionsSection = questions.map(q => 
      `  - ID: "${q.id}" | Question: "${q.text}" | Type: ${q.type} | Instructions: ${this.getTypeInstructions(q.type)}`
    ).join('\n');

    // Build the example questionResponses object
    const exampleResponses = questions.map(q => 
      `      "${q.id}": ${this.getTypeExample(q.type)}`
    ).join(',\n');

    for (let i = 0; i < profiles.length; i += batchSize) {
      const batch = profiles.slice(i, i + batchSize);
      
      for (const concept of concepts) {
        const currentElapsed = Date.now() - startTime;
        const totalBatches = Math.ceil(profiles.length / batchSize);
        const currentBatch = Math.floor(i / batchSize) + 1;
        const conceptIndex = concepts.indexOf(concept) + 1;
        console.log(`📊 [DEBUG] Processing batch ${currentBatch}/${totalBatches}, concept ${conceptIndex}/${concepts.length} (${currentElapsed}ms elapsed)`);
        
        const currentModel = models[(i + concepts.indexOf(concept)) % models.length];

        // Build consumer profiles section
        const profilesSection = batch.map(profile => 
`Profile ID: "${profile.id}"
  Demographics: ${profile.age}yo ${profile.gender}, ${profile.location}, ${profile.income}, ${profile.education}
  Lifestyle: ${profile.lifestyle}
  Interests: ${profile.interests.join(', ')}
  Shopping: ${profile.shoppingBehavior}
  Tech savviness: ${profile.techSavviness} | Eco awareness: ${profile.environmentalAwareness}
  Brand loyalty: ${profile.brandLoyalty} | Price sensitivity: ${profile.pricesensitivity}`
        ).join('\n\n');

        // Build the structured prompt
        const promptText = `## Task
Evaluate the following product concept from the perspective of each consumer profile. For each profile, answer every survey question as if you ARE that person.

## Product Concept
Title: "${concept.title}"
Description: "${concept.description}"
${concept.imageBase64 ? '[A product image is attached — consider its visual design, packaging, and presentation in your evaluation]' : ''}

## Survey Questions
${surveyQuestionsSection}

## Consumer Profiles
${profilesSection}

## Required JSON Response Format
Return ONLY a valid JSON array. Each element must match this exact schema:
[
  {
    "profileId": "the_profile_id",
    "conceptId": "${concept.id}",
    "questionResponses": {
${exampleResponses}
    }
  }
]

IMPORTANT: Return exactly ${batch.length} objects, one per profile. Use the exact profile IDs and concept ID shown above. For scale questions, return integers only. For open-ended questions, respond in first person as the consumer.`;

        const systemPrompt = 'You are a consumer research simulator. You embody different consumer personas and provide their authentic, first-person reactions to product concepts. Consider each person\'s unique demographics, lifestyle, values, and circumstances when responding. IMPORTANT: Respond with valid JSON only — no markdown code blocks, no explanations, no text before or after the JSON array.';

        try {
          let response;
          let modelUsed = currentModel;
          
          const userContent = this.buildUserMessageContent(promptText, concept);
          
          try {
            response = await openai.chat.completions.create({
              model: currentModel,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userContent }
              ],
              temperature: 0.3,
              max_tokens: 2000,
            });
          } catch (modelError) {
            console.warn(`Model ${currentModel} failed, falling back to gpt-4o:`, modelError);
            modelUsed = 'gpt-4o';
            response = await openai.chat.completions.create({
              model: 'gpt-4o',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userContent }
              ],
              temperature: 0.3,
              max_tokens: 2000,
            });
          }

          const content = response.choices[0]?.message?.content;
          if (content) {
            try {
              const cleanedContent = this.extractJsonFromResponse(content);
              const batchAnalyses: PreferenceAnalysis[] = JSON.parse(cleanedContent);
              analyses.push(...batchAnalyses);
              console.log(`✅ Successfully analyzed concept ${concept.id} using model ${modelUsed}`);
            } catch (parseError) {
              console.error(`Failed to parse analysis response for concept ${concept.id} using model ${modelUsed}:`, parseError);
              console.error('Raw content:', content);
            }
          }
        } catch (error) {
          console.error(`Error analyzing preferences for concept ${concept.id}:`, error);
        }
      }
    }

    console.log(`🔚 [DEBUG] AIService.analyzePreferences completed with ${analyses.length} total analyses`);
    return analyses;
  }

  static async generateInsights(
    profiles: ConsumerProfile[],
    concepts: Concept[],
    analyses: PreferenceAnalysis[]
  ): Promise<string[]> {
    console.log('🤖 [DEBUG] Using AI SERVICE for insights generation');
    console.log(`🤖 [DEBUG] Generating insights from ${analyses.length} analyses`);
    
    const prompt = `Based on the consumer preference analysis data, generate 5-7 key insights about how different consumer segments respond to the product concepts.

SUMMARY DATA:
- Total Profiles Analyzed: ${profiles.length}
- Total Concepts Tested: ${concepts.length}
- Total Analyses: ${analyses.length}

CONCEPTS:
${concepts.map(concept => `- ${concept.title}: ${concept.description}`).join('\n')}

AVERAGE SCORES BY CONCEPT:
${concepts.map(concept => {
  const conceptAnalyses = analyses.filter(a => a.conceptId === concept.id);
  if (conceptAnalyses.length === 0) {
    return `${concept.title}: No data`;
  }
  
  const getAvgForQuestion = (qId: string) => {
    const responses = conceptAnalyses
      .map(a => a.questionResponses ? Number(a.questionResponses[qId]) : NaN)
      .filter(n => !isNaN(n));
    return responses.length > 0 ? responses.reduce((sum, r) => sum + r, 0) / responses.length : 0;
  };
  
  const avgPref = getAvgForQuestion('preference');
  const avgInno = getAvgForQuestion('innovativeness');
  const avgDiff = getAvgForQuestion('differentiation');
  
  return `${concept.title}: Preference ${avgPref.toFixed(1)}, Innovation ${avgInno.toFixed(1)}, Differentiation ${avgDiff.toFixed(1)}`;
}).join('\n')}

Generate actionable insights about:
1. Which concepts perform best/worst and why
2. Demographic patterns in responses
3. Opportunities for improvement
4. Market positioning recommendations
5. Target audience insights

Return as a JSON array of insight strings:
["insight 1", "insight 2", "insight 3", ...]`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a senior market research analyst. Generate actionable insights from consumer preference data. Focus on practical recommendations and clear patterns. IMPORTANT: Respond with valid JSON only - no markdown code blocks, no explanations, just a pure JSON array of strings.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 1500,
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        try {
          const cleanedContent = this.extractJsonFromResponse(content);
          return JSON.parse(cleanedContent);
        } catch (parseError) {
          console.error('Failed to parse insights response:', parseError);
          console.error('Raw content:', content);
          return ['Unable to generate detailed insights due to parsing error.'];
        }
      }
      
      return ['Unable to generate insights from the analysis data.'];
    } catch (error) {
      console.error('Error generating insights:', error);
      return ['Error occurred while generating insights from the analysis.'];
    }
  }
}
