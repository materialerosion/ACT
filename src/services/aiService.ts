import OpenAI from 'openai';
import { ConsumerProfile, DemographicInput, PreferenceAnalysis, Concept } from '@/types';

const openai = new OpenAI({
  baseURL: process.env.BAYER_API_URL,
  apiKey: process.env.BAYER_API_KEY,
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
        // First batch: Full instructions
        // add psychographic information such as how many times they have bought a product in the last 6 months
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
        
        Ensure variety and realism. Each profile should be unique and realistic.`;
        
        // Initialize conversation history for first batch
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
        // Subsequent batches: Use continue prompt
        prompt = `continue - generate exactly ${currentBatchSize} more diverse consumer profiles following the same format and demographic constraints. Ensure they are different from previous profiles and maintain variety.`;
        
        // Add the continue prompt to conversation history
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

        // Extract and parse the JSON response
        const cleanedContent = this.extractJsonFromResponse(content);
        
        try {
          const batchProfiles: ConsumerProfile[] = JSON.parse(cleanedContent);
          
          // Validate the batch
          if (Array.isArray(batchProfiles) && batchProfiles.length > 0) {
            profiles.push(...batchProfiles);
            console.log(`Successfully generated ${batchProfiles.length} profiles in batch ${i / batchSize + 1}`);
            
            // Add the AI response to conversation history for context in next batch
            conversationHistory.push({
              role: 'assistant',
              content: cleanedContent
            });
            
            // Keep conversation history manageable - only keep system message + last 2 exchanges
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
          // Continue with next batch instead of failing completely
        }
      } catch (error) {
        console.error(`Error generating profiles for batch ${i / batchSize + 1}:`, error);
        // Continue with next batch instead of failing completely
      }
    }

    // If we got some profiles, return them, otherwise throw error
    if (profiles.length > 0) {
      console.log(`Successfully generated ${profiles.length} total profiles`);
      return profiles.slice(0, count); // Ensure we don't exceed the requested count
    } else {
      throw new Error('Failed to generate consumer profiles');
    }
  }

  static async analyzePreferences(
    profiles: ConsumerProfile[], 
    concepts: Concept[]
  ): Promise<PreferenceAnalysis[]> {
    console.log('🤖 [DEBUG] Using AI SERVICE for preference analysis');
    console.log(`🤖 [DEBUG] Analyzing ${profiles.length} profiles against ${concepts.length} concepts using AI`);
    
    const analyses: PreferenceAnalysis[] = [];
    const startTime = Date.now();
    
    // Available models to rotate through - including corrected Claude model name for myGenAssist
    const models = ['grok-3', 'gpt-4o-mini', 'gpt-5-nano', 'claude-sonnet-4'];
    
    // Process profiles in larger batches to reduce API calls and improve speed
    const batchSize = 5; // Increased to 5 to reduce total processing time further
    
    for (let i = 0; i < profiles.length; i += batchSize) {
      const batch = profiles.slice(i, i + batchSize);
      
      for (const concept of concepts) {
        // Progress tracking
        const currentElapsed = Date.now() - startTime;
        const totalBatches = Math.ceil(profiles.length / batchSize);
        const currentBatch = Math.floor(i / batchSize) + 1;
        const conceptIndex = concepts.indexOf(concept) + 1;
        console.log(`📊 [DEBUG] Processing batch ${currentBatch}/${totalBatches}, concept ${conceptIndex}/${concepts.length} (${currentElapsed}ms elapsed)`);
        
        // Rotate through models based on current iteration
        const currentModel = models[(i + concepts.indexOf(concept)) % models.length];
        
        const prompt = `I want you to put yourself in the shoes of each consumer profile below and respond to this product concept from their personal perspective.

PRODUCT CONCEPT TO EVALUATE:
"${concept.title}"
Description: "${concept.description}"

CONSUMER PROFILES TO EMBODY:
${batch.map(profile => `
Profile ${profile.id} - Put yourself in my shoes as:
- I am ${profile.age} years old, ${profile.gender}
- I live in ${profile.location}
- My income level: ${profile.income}
- My education: ${profile.education}
- My lifestyle: ${profile.lifestyle}
- My interests: ${profile.interests.join(', ')}
- How I shop: ${profile.shoppingBehavior}
- My tech comfort level: ${profile.techSavviness}
- My environmental views: ${profile.environmentalAwareness}
- My brand loyalty: ${profile.brandLoyalty}
- My price sensitivity: ${profile.pricesensitivity}
`).join('\n')}

For each profile, speaking as that person, rate on a scale of 1-10:
1. PREFERENCE: How much would I personally like/prefer this concept?
2. INNOVATIVENESS: How innovative/new does this concept seem to me?
3. DIFFERENTIATION: How different/unique is this concept from what I've seen from competitors?

Also provide brief reasoning from that person's perspective (1-2 sentences starting with "I think..." or "I feel...").

Return as JSON array:
[
  {
    "profileId": "profile_id",
    "conceptId": "${concept.id}",
    "preference": number,
    "innovativeness": number,
    "differentiation": number,
    "reasoning": "first person explanation from this consumer's perspective"
  }
]`;

        try {
          let response;
          let modelUsed = currentModel;
          
          try {
            // Try the selected model first
            response = await openai.chat.completions.create({
              model: currentModel,
              messages: [
                {
                  role: 'system',
                  content: 'You are a method actor who can embody different consumer personas. When given consumer profiles, you will think and respond exactly as each person would, using their personal perspective and voice. Consider their unique background, values, and circumstances. IMPORTANT: Respond with valid JSON only - no markdown code blocks, no explanations, just a pure JSON array with first-person reasoning.'
                },
                {
                  role: 'user',
                  content: prompt
                }
              ],
              temperature: 0.3,
              max_tokens: 2000,
            });
          } catch (modelError) {
            console.warn(`Model ${currentModel} failed, falling back to gpt-4o:`, modelError);
            // Fallback to default model if current model fails
            modelUsed = 'gpt-4o';
            response = await openai.chat.completions.create({
              model: 'gpt-4o',
              messages: [
                {
                  role: 'system',
                  content: 'You are a method actor who can embody different consumer personas. When given consumer profiles, you will think and respond exactly as each person would, using their personal perspective and voice. Consider their unique background, values, and circumstances. IMPORTANT: Respond with valid JSON only - no markdown code blocks, no explanations, just a pure JSON array with first-person reasoning.'
                },
                {
                  role: 'user',
                  content: prompt
                }
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
              // Continue with other concepts even if one fails
            }
          }
        } catch (error) {
          console.error(`Error analyzing preferences for concept ${concept.id}:`, error);
          // Continue with other concepts even if one fails
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
  const avgPref = conceptAnalyses.reduce((sum, a) => sum + a.preference, 0) / conceptAnalyses.length;
  const avgInno = conceptAnalyses.reduce((sum, a) => sum + a.innovativeness, 0) / conceptAnalyses.length;
  const avgDiff = conceptAnalyses.reduce((sum, a) => sum + a.differentiation, 0) / conceptAnalyses.length;
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
          // Return a fallback insight
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
