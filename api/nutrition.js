export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { ingredients, servings } = req.body;
    
    if (!ingredients) {
      return res.status(400).json({ error: 'Ingredients required' });
    }

    const ingredientList = ingredients
      .split('\n')
      .map(i => i.trim())
      .filter(i => i.length > 0)
      .slice(0, 5);

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    for (const ingredient of ingredientList) {
      try {
        const query = ingredient.replace(/^\*\s*/, '').split(',')[0];
        const response = await fetch(
          `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=1`
        );
        const data = await response.json();

        if (data.foods?.[0]?.foodNutrients) {
          const nutrients = data.foods[0].foodNutrients;
          totalCalories += nutrients.find(n => n.nutrientId === 1008)?.value || 0;
          totalProtein += nutrients.find(n => n.nutrientId === 1003)?.value || 0;
          totalCarbs += nutrients.find(n => n.nutrientId === 1005)?.value || 0;
          totalFat += nutrients.find(n => n.nutrientId === 1004)?.value || 0;
        }
      } catch (e) {
        // continue
      }
    }

    const servingCount = parseInt(servings) || 1;
    
    res.status(200).json({
      calories: Math.round(totalCalories / servingCount),
      protein: Math.round(totalProtein / servingCount),
      carbs: Math.round(totalCarbs / servingCount),
      fat: Math.round(totalFat / servingCount)
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
