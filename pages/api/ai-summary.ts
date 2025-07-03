import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface FeedbackData {
  id: string;
  folder_name: string;
  standard: string;
  quiz_id: string;
  standard_alignment_rating: number | null;
  quality_rating: number | null;
  pedagogy_rating: number | null;
  feedback_text: string | null;
  created_at: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { feedbackData }: { feedbackData: FeedbackData[] } = req.body;

    if (!feedbackData || feedbackData.length === 0) {
      return res.status(400).json({ message: 'No feedback data provided' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ message: 'OpenAI API key not configured' });
    }

    // Prepare data for analysis
    const folderName = feedbackData[0]?.folder_name || 'Unknown';
    const totalFeedback = feedbackData.length;
    
    // Calculate averages
    const ratingsData = feedbackData.filter(item => 
      item.standard_alignment_rating || item.quality_rating || item.pedagogy_rating
    );
    
    const avgStandard = ratingsData.reduce((sum, item) => sum + (item.standard_alignment_rating || 0), 0) / 
      ratingsData.filter(item => item.standard_alignment_rating).length || 0;
    const avgQuality = ratingsData.reduce((sum, item) => sum + (item.quality_rating || 0), 0) / 
      ratingsData.filter(item => item.quality_rating).length || 0;
    const avgPedagogy = ratingsData.reduce((sum, item) => sum + (item.pedagogy_rating || 0), 0) / 
      ratingsData.filter(item => item.pedagogy_rating).length || 0;

    // Get unique standards
    const standards = Array.from(new Set(feedbackData.map(item => item.standard)));
    
    // Get feedback text (filter out empty ones)
    const textFeedback = feedbackData
      .filter(item => item.feedback_text && item.feedback_text.trim().length > 0)
      .map(item => ({
        standard: item.standard,
        text: item.feedback_text,
        ratings: {
          standard: item.standard_alignment_rating,
          quality: item.quality_rating,
          pedagogy: item.pedagogy_rating
        }
      }));

    // Create prompt for OpenAI
    const prompt = `You are an educational assessment analyst. Please analyze the following quiz feedback data and provide a comprehensive summary:

**Folder Analysis: ${folderName}**

**Quantitative Overview:**
- Total Feedback Entries: ${totalFeedback}
- Ratings Available: ${ratingsData.length}
- Average Standard Alignment: ${avgStandard.toFixed(2)}/3
- Average Quality Rating: ${avgQuality.toFixed(2)}/3
- Average Pedagogy Rating: ${avgPedagogy.toFixed(2)}/3

**Standards Covered (${standards.length} total):**
${standards.map(std => `- ${std}`).join('\n')}

**Detailed Feedback Analysis:**
${textFeedback.slice(0, 20).map(item => `
Standard: ${item.standard}
Ratings: S:${item.ratings.standard || 'N/A'}, Q:${item.ratings.quality || 'N/A'}, P:${item.ratings.pedagogy || 'N/A'}
Feedback: ${item.text}
---`).join('\n')}

${textFeedback.length > 20 ? `\n[... and ${textFeedback.length - 20} more feedback entries]` : ''}

Please provide:

1. **Executive Summary** (2-3 sentences overview)
2. **Key Strengths** (what's working well)
3. **Areas for Improvement** (specific concerns or patterns)
4. **Rating Analysis** (interpretation of the numerical ratings)
5. **Standards Performance** (which standards are performing well/poorly)
6. **Actionable Recommendations** (3-5 specific suggestions)
7. **Overall Assessment** (letter grade or score with justification)

Format your response in clear sections with markdown formatting for readability.`;

    // Make OpenAI API call
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert educational assessment analyst specializing in quiz feedback analysis and educational improvement recommendations."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const aiSummary = completion.choices[0]?.message?.content;

    if (!aiSummary) {
      return res.status(500).json({ message: 'Failed to generate AI summary' });
    }

    res.status(200).json({
      summary: aiSummary,
      metadata: {
        folderName,
        totalFeedback,
        ratingsCount: ratingsData.length,
        averages: {
          standard: parseFloat(avgStandard.toFixed(2)),
          quality: parseFloat(avgQuality.toFixed(2)),
          pedagogy: parseFloat(avgPedagogy.toFixed(2))
        },
        standardsCount: standards.length,
        textFeedbackCount: textFeedback.length
      }
    });

  } catch (error) {
    console.error('AI Summary error:', error);
    res.status(500).json({ 
      message: 'Failed to generate AI summary',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 