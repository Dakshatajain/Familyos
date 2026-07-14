export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { ingredients, servings } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error('GEMINI_API_KEY not found in environment');
      return res.status(500).json({ error: 'API key not configured' });
    }

    if (!ingredients) {
      return res.status(400).json({ error: 'Ingredients required' });
    }

    console.log('Calling Gemini API with ingredients:', ingredients.substring(0, 50));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Estimate nutrition per serving for ${servings || 1} servings. Ingredients: ${ingredients}. Reply ONLY with valid JSON: {"calories":NUMBER,"protein":NUMBER,"carbs":NUMBER,"fat":NUMBER}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 200
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API error:', data);
      return res.status(400).json({ error: 'Gemini API error: ' + JSON.stringify(data) });
    }

    if (!data.candidates || !data.candidates[0]) {
      console.error('No candidates in response:', data);
      return res.status(400).json({ error: 'Invalid response from Gemini' });
    }

    const text = data.candidates[0].content.parts[0].text;
    console.log('Gemini response:', text);

    const match = text.match(/\{[\s\S]*\}/);

    if (!match) {
      console.error('Could not parse JSON from response:', text);
      return res.status(400).json({ error: 'Could not parse nutrition data' });
    }

    const nutrition = JSON.parse(match[0]);
    console.log('Parsed nutrition:', nutrition);

    return res.status(200).json(nutrition);
  } catch (error) {
    console.error('Nutrition calc error:', error);
    return res.status(500).json({ error: error.message });
  }
}
