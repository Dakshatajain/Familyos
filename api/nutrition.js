export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { ingredients, servings } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    if (!ingredients) {
      return res.status(400).json({ error: 'Ingredients required' });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Estimate nutrition per serving for ${servings || 1} servings based on: ${ingredients}\n\nReply ONLY with JSON: {"calories":NUMBER,"protein":NUMBER,"carbs":NUMBER,"fat":NUMBER}`
            }]
          }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: 'Gemini API error' });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const match = text?.match(/\{[\s\S]*\}/);

    if (!match) {
      return res.status(500).json({ error: 'Could not parse nutrition data' });
    }

    const nutrition = JSON.parse(match[0]);
    res.status(200).json(nutrition);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
