export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { ingredients, servings } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'API key missing - contact admin' });
    }

    if (!ingredients || ingredients.trim() === '') {
      return res.status(400).json({ error: 'Ingredients required' });
    }

    const prompt = `For this recipe with ${servings || 1} servings, estimate nutrition values per serving based on these ingredients: ${ingredients}

Return ONLY valid JSON, no other text:
{
  "calories": <number>,
  "protein": <number>,
  "carbs": <number>,
  "fat": <number>
}

Use reasonable estimates. All values should be numbers only.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 256
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ 
        error: 'Gemini API failed',
        details: data.error?.message || JSON.stringify(data)
      });
    }

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      return res.status(500).json({ error: 'No response from Gemini' });
    }

    const text = data.candidates[0].content.parts[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return res.status(500).json({ 
        error: 'Could not parse response',
        received: text.substring(0, 100)
      });
    }

    const nutrition = JSON.parse(jsonMatch[0]);
    
    return res.status(200).json({
      calories: Math.round(nutrition.calories || 0),
      protein: Math.round(nutrition.protein || 0),
      carbs: Math.round(nutrition.carbs || 0),
      fat: Math.round(nutrition.fat || 0)
    });

  } catch (error) {
    return res.status(500).json({ 
      error: 'Server error',
      message: error.message 
    });
  }
}
