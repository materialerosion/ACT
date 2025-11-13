import { ConsumerProfile, DemographicInput, PreferenceAnalysis, Concept } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export class MockDataService {
  static generateMockProfiles(demographics: DemographicInput, count: number = 100): ConsumerProfile[] {
    console.log('🔧 [DEBUG] Using MOCK DATA SERVICE for profile generation');
    console.log(`🔧 [DEBUG] Generating ${count} mock profiles with demographics:`, demographics);
    
    const profiles: ConsumerProfile[] = [];

    const firstNames = [
      'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason', 'Isabella', 'William',
      'Mia', 'James', 'Charlotte', 'Benjamin', 'Amelia', 'Lucas', 'Harper', 'Henry', 'Evelyn', 'Alexander',
      'Abigail', 'Michael', 'Emily', 'Daniel', 'Elizabeth', 'Matthew', 'Mila', 'Aiden', 'Ella', 'Jackson',
      'Madison', 'David', 'Scarlett', 'Joseph', 'Victoria', 'Samuel', 'Aria', 'John', 'Grace', 'Owen',
      'Chloe', 'Wyatt', 'Camila', 'Jack', 'Penelope', 'Luke', 'Riley', 'Jayden', 'Layla', 'Dylan'
    ];

    const lastNames = [
      'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
      'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
      'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
      'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
      'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'
    ];

    const lifestyles = [
      'Health-conscious and active lifestyle',
      'Family-oriented and community-focused',
      'Tech-savvy urban professional',
      'Budget-conscious value seeker',
      'Premium quality enthusiast',
      'Environmentally conscious consumer',
      'Social media influencer lifestyle',
      'Traditional and brand loyal',
      'Adventure-seeking and spontaneous',
      'Minimalist and efficiency-focused'
    ];

    const interests = [
      'Fitness and wellness', 'Cooking and food', 'Travel and exploration', 'Technology and gadgets',
      'Art and culture', 'Sports and recreation', 'Fashion and style', 'Music and entertainment',
      'Reading and learning', 'Gardening and nature', 'Gaming and digital entertainment',
      'Photography and visual arts', 'Social causes and volunteering', 'DIY and crafts',
      'Financial planning and investment'
    ];

    const shoppingBehaviors = [
      'Researches extensively before purchasing',
      'Impulse buyer influenced by promotions',
      'Brand loyal and prefers familiar products',
      'Price-sensitive and comparison shops',
      'Values convenience and quick purchases',
      'Seeks recommendations from others',
      'Prefers online shopping',
      'Enjoys in-store browsing experience',
      'Bulk buyer for value savings',
      'Trend-follower and early adopter'
    ];

    const techLevels = ['Low', 'Medium', 'High', 'Very High'];
    const environmentalLevels = ['Low', 'Medium', 'High', 'Very High'];
    const brandLoyaltyLevels = ['Low', 'Medium', 'High', 'Very High'];
    const priceSensitivityLevels = ['Low', 'Medium', 'High', 'Very High'];

    for (let i = 0; i < count; i++) {
      // Generate age within the demographic ranges
      const selectedAgeRange = demographics.ageRanges[Math.floor(Math.random() * demographics.ageRanges.length)];
      const ageRange = selectedAgeRange.split('-');
      const minAge = parseInt(ageRange[0]);
      const maxAge = parseInt(ageRange[1]) || minAge + 10;
      const age = Math.floor(Math.random() * (maxAge - minAge + 1)) + minAge;

      // Randomly select from demographic options
      const gender = demographics.genders[Math.floor(Math.random() * demographics.genders.length)];
      const location = demographics.locations[Math.floor(Math.random() * demographics.locations.length)];
      const income = demographics.incomeRanges[Math.floor(Math.random() * demographics.incomeRanges.length)];
      const education = demographics.educationLevels[Math.floor(Math.random() * demographics.educationLevels.length)];

      // Generate random characteristics
      const lifestyle = lifestyles[Math.floor(Math.random() * lifestyles.length)];
      const numInterests = Math.floor(Math.random() * 4) + 2; // 2-5 interests
      const profileInterests: string[] = [];
      for (let j = 0; j < numInterests; j++) {
        const interest = interests[Math.floor(Math.random() * interests.length)];
        if (!profileInterests.includes(interest)) {
          profileInterests.push(interest);
        }
      }

      // Generate random name
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const name = `${firstName} ${lastName}`;

      const profile: ConsumerProfile = {
        id: uuidv4(),
        name,
        age,
        gender,
        location,
        income,
        education,
        lifestyle,
        interests: profileInterests,
        shoppingBehavior: shoppingBehaviors[Math.floor(Math.random() * shoppingBehaviors.length)],
        techSavviness: techLevels[Math.floor(Math.random() * techLevels.length)],
        environmentalAwareness: environmentalLevels[Math.floor(Math.random() * environmentalLevels.length)],
        brandLoyalty: brandLoyaltyLevels[Math.floor(Math.random() * brandLoyaltyLevels.length)],
        pricesensitivity: priceSensitivityLevels[Math.floor(Math.random() * priceSensitivityLevels.length)]
      };

      profiles.push(profile);
    }

    return profiles;
  }

  static generateMockAnalyses(profiles: ConsumerProfile[], concepts: Concept[]): PreferenceAnalysis[] {
    console.log('🔧 [DEBUG] Using MOCK DATA SERVICE for preference analysis');
    console.log(`🔧 [DEBUG] Analyzing ${profiles.length} profiles against ${concepts.length} concepts`);
    
    const analyses: PreferenceAnalysis[] = [];

    const reasoningTemplates = [
      "This consumer's {} lifestyle and {} interests align well with the concept.",
      "Given their {} income level and {} education, they would likely find this appealing.",
      "Their {} shopping behavior and {} price sensitivity influence their response.",
      "As someone with {} environmental awareness, this concept resonates with their values.",
      "Their {} tech savviness and {} brand loyalty affect their perception of innovation.",
      "Based on their {} lifestyle in a {} area, this concept has moderate appeal.",
      "Their {} interests and {} shopping behavior suggest strong interest in this concept.",
      "Given their {} characteristics, they see this as moderately differentiated."
    ];

    profiles.forEach(profile => {
      concepts.forEach(concept => {
        // Generate scores based on profile characteristics with some randomness
        let basePreference = Math.random() * 10;
        let baseInnovation = Math.random() * 10;
        let baseDifferentiation = Math.random() * 10;

        // Adjust scores based on profile characteristics
        if (profile.environmentalAwareness === 'High' || profile.environmentalAwareness === 'Very High') {
          if (concept.description.toLowerCase().includes('eco') || concept.description.toLowerCase().includes('green') || concept.description.toLowerCase().includes('sustain')) {
            basePreference += 2;
            baseDifferentiation += 1;
          }
        }

        if (profile.techSavviness === 'High' || profile.techSavviness === 'Very High') {
          if (concept.description.toLowerCase().includes('technolog') || concept.description.toLowerCase().includes('advanced') || concept.description.toLowerCase().includes('innovation')) {
            baseInnovation += 2;
            basePreference += 1;
          }
        }

        if (profile.pricesensitivity === 'High' || profile.pricesensitivity === 'Very High') {
          if (concept.description.toLowerCase().includes('premium') || concept.description.toLowerCase().includes('luxury')) {
            basePreference -= 1;
          }
          if (concept.description.toLowerCase().includes('value') || concept.description.toLowerCase().includes('affordable')) {
            basePreference += 1;
          }
        }

        // Normalize scores to 1-10 range
        const preference = Math.max(1, Math.min(10, Math.round(basePreference)));
        const innovativeness = Math.max(1, Math.min(10, Math.round(baseInnovation)));
        const differentiation = Math.max(1, Math.min(10, Math.round(baseDifferentiation)));

        // Generate reasoning
        const template = reasoningTemplates[Math.floor(Math.random() * reasoningTemplates.length)];
        const reasoning = template
          .replace('{}', profile.lifestyle.split(' ')[0].toLowerCase())
          .replace('{}', profile.interests[0].toLowerCase())
          .replace('{}', profile.income.toLowerCase())
          .replace('{}', profile.education.toLowerCase())
          .replace('{}', profile.shoppingBehavior.split(' ')[0].toLowerCase())
          .replace('{}', profile.pricesensitivity.toLowerCase())
          .replace('{}', profile.environmentalAwareness.toLowerCase())
          .replace('{}', profile.techSavviness.toLowerCase())
          .replace('{}', profile.brandLoyalty.toLowerCase())
          .replace('{}', profile.location.toLowerCase());

        const analysis: PreferenceAnalysis = {
          profileId: profile.id,
          conceptId: concept.id,
          preference,
          innovativeness,
          differentiation,
          reasoning
        };

        analyses.push(analysis);
      });
    });

    return analyses;
  }

  static generateMockInsights(profiles: ConsumerProfile[], concepts: Concept[], analyses: PreferenceAnalysis[]): string[] {
    console.log('🔧 [DEBUG] Using MOCK DATA SERVICE for insights generation');
    console.log(`🔧 [DEBUG] Generating mock insights from ${analyses.length} analyses`);
    
    const insights = [
      `Analysis of ${profiles.length} consumer profiles reveals significant preference variations across different demographic segments.`,
      `${concepts.length > 1 ? 'The top-performing concept' : 'The analyzed concept'} shows strong appeal among tech-savvy consumers aged 25-45.`,
      'Environmental consciousness strongly correlates with preference scores for sustainability-focused concepts.',
      'Price-sensitive consumers show lower preference scores for premium-positioned concepts but higher scores for value-oriented messaging.',
      'Urban consumers demonstrate higher innovation scores compared to rural demographics.',
      'Higher education levels correlate with increased appreciation for detailed product specifications and technical features.',
      'Brand loyalty varies significantly across age groups, with older consumers showing stronger loyalty tendencies.'
    ];

    // Randomly select 5-7 insights
    const selectedInsights: string[] = [];
    const numInsights = Math.floor(Math.random() * 3) + 5; // 5-7 insights
    
    while (selectedInsights.length < numInsights && selectedInsights.length < insights.length) {
      const insight = insights[Math.floor(Math.random() * insights.length)];
      if (!selectedInsights.includes(insight)) {
        selectedInsights.push(insight);
      }
    }

    return selectedInsights;
  }
}