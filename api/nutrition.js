module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { ingredients, servings } = req.body;

    if (!ingredients) {
      return res.status(400).json({ error: 'Ingredients required' });
    }

    // Remove quantities like "300g", "1 cup" so USDA can find the ingredient
    const ingredientList = ingredients
      .split(/[\*,\n]/)
      .map(i => i.trim())
      .filter(i => i.length > 0)
      .map(i => i.replace(/^\d+\s*[a-z]+\s*/i, '').replace(/\(.*?\)/g, '').trim())
      .filter(i => i.length > 0)
      .slice(0, 5);

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    for (const ingredient of ingredientList) {
      try {
        const response = await fetch(
          `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(ingredient)}&pageSize=1`
        );
        const data = await response.json();

        if (data.foods && data.foods.length > 0) {
          const food = data.foods[0];
          const nutrients = food.foodNutrients || [];

          const calories = nutrients.find(n => n.nutrientId === 1008)?.value || 0;
          const protein = nutrients.find(n => n.nutrientId === 1003)?.value || 0;
          const carbs = nutrients.find(n => n.nutrientId === 1005)?.value || 0;
          const fat = nutrients.find(n => n.nutrientId === 1004)?.value || 0;

          totalCalories += calories;
          totalProtein += protein;
          totalCarbs += carbs;
          totalFat += fat;
        }
      } catch (e) {
        // Continue
      }
    }

    const servingCount = parseInt(servings)
