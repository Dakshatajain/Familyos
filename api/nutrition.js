module.exports = async function handler(req, res) {
  try {
    const { ingredients } = req.body;
    if (!ingredients) return res.status(400).json({ error: 'Ingredients required' });

    // Simple regex to extract just the ingredient name
    const ingredientList = ingredients
      .split(/[\*,\n]/)
      .map(i => i.replace(/^\d+[a-z]*\s*/i, '').replace(/[\(\)]/g, '').trim())
      .filter(i => i.length > 2)
      .slice(0, 3);

    let totalCal = 0, totalPro = 0, totalCarb = 0, totalFat = 0;

    for (const ingredient of ingredientList) {
      try {
        const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(ingredient)}&pageSize=1`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data.foods) continue;
        const food = data.foods[0];
        const n = food.foodNutrients || [];
        
        totalCal += n.find(x => x.nutrientId === 1008)?.value || 0;
        totalPro += n.find(x => x.nutrientId === 1003)?.value || 0;
        totalCarb += n.find(x => x.nutrientId === 1005)?.value || 0;
        totalFat += n.find(x => x.nutrientId === 1004)?.value || 0;
      } catch (e) {}
    }

    res.json({
      calories: Math.round(totalCal / 3),
      protein: Math.round(totalPro / 3),
      carbs: Math.round(totalCarb / 3),
      fat: Math.round(totalFat / 3)
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
