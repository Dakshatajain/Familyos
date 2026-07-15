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
    `https://generativelanguage.googleapis.com/v1beta/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
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

  const data = await response.json();

// const response = await fetch(
//   `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
// );

// const data = await response.json();

console.log(
  "Available models:",
  JSON.stringify(data, null, 2)
);

return res.status(200).json(data);

    console.log(
      "Gemini response:",
      JSON.stringify(data, null, 2)
    );

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
    console.error(error);

    return res.status(500).json({
      error: error.message
    });
  }
}
