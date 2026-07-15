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
      .slice(0, 1);

    console.log('Searching for:', ingredientList);

    for (const ingredient of ingredientList) {
      try {
        const query = ingredient.replace(/^\*\s*/, '').split(',')[0];
        console.log('Query:', query);
        
        const response = await fetch(
          `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=1`
        );
        const data = await response.json();
        
        console.log('USDA Response:', JSON.stringify(data, null, 2));
        
        if (data.foods?.[0]) {
          console.log('Food found:', data.foods[0].description);
          console.log('Nutrients:', data.foods[0].foodNutrients);
        }
      } catch (e) {
        console.log('Error:', e.message);
      }
    }

    res.status(200).json({
      calories: 100,
      protein: 10,
      carbs: 15,
      fat: 5
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
