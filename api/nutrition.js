export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { ingredients, servings } = req.body;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Estimate nutrition per serving for ${servings || 1} servings. Ingredients: ${ingredients}. Reply ONLY with valid JSON (no markdown): {"calories":NUMBER,"protein":NUMBER,"carbs":NUMBER,"fat":NUMBER}`
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
    const text = data.candidates[0].content.parts[0].text;
    const match = text.match(/\{[\s\S]*\}/);

    if (!match) {
      return res.status(400).json({ error: 'Could not parse nutrition' });
    }

    const nutrition = JSON.parse(match[0]);
    res.status(200).json(nutrition);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}
