export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { ingredients, servings } = req.body;
    if (!ingredients) return res.status(400).json({ error: 'Ingredients required' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Gemini API key is not configured.' });

    const responseSchema = {
      type: "OBJECT",
      properties: {
        calories: { type: "INTEGER", description: "Total calories for the entire recipe" },
        protein: { type: "INTEGER", description: "Total protein in grams" },
        carbs: { type: "INTEGER", description: "Total carbohydrates in grams" },
        fat: { type: "INTEGER", description: "Total fat in grams" }
      },
      required: ["calories", "protein", "carbs", "fat"]
    };

    const prompt = `
You are a professional nutrition analyzer. Analyze the following list of ingredients and calculate the total nutrition (Calories, Protein in grams, Carbs in grams, and Fat in grams) for the ENTIRE recipe.

Ingredients:
${ingredients}

Return the total amounts for the entire batch. Do not divide by servings.
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
          },
        }),
      }
    );

    if (!response.ok) throw new Error(`Gemini API returned status ${response.status}`);

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!resultText) throw new Error("Failed to retrieve parsed text.");

    const totals = JSON.parse(resultText);
    const divisor = Math.max(1, parseInt(servings) || 1);

    return res.status(200).json({
      calories: Math.round(totals.calories / divisor),
      protein: Math.round(totals.protein / divisor),
      carbs: Math.round(totals.carbs / divisor),
      fat: Math.round(totals.fat / divisor),
    });

  } catch (error) {
    console.error('Nutrition API Error:', error);
    return res.status(500).json({ error: 'Failed to calculate nutrition properties.' });
  }
}
