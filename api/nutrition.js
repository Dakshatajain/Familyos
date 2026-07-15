export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed'
    });
  }

  try {
    const { ingredients, servings } = req.body;

    const prompt = `
Estimate nutrition PER SERVING for this recipe.

Ingredients:
${ingredients}

Servings:
${servings}

Return ONLY valid JSON.

{
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number
}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        })
      }
    );

    const raw = await response.text();

    console.log("HTTP status:", response.status);
    console.log("Gemini raw response:", raw);

    if (!raw) {
      return res.status(500).json({
        error: "Empty response from Gemini"
      });
    }

    const data = JSON.parse(raw);

    if (!data.candidates) {
      return res.status(500).json(data);
    }

    const text =
      data.candidates[0].content.parts[0].text;

    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const nutrition = JSON.parse(cleaned);

    return res.status(200).json(nutrition);

  } catch (error) {
    console.error("Error:", error);

    return res.status(500).json({
      error: error.message
    });
  }
}
