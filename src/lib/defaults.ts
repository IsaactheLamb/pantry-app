import { Pantry, Recipe } from './types';
import { v4 as uuidv4 } from 'uuid';

export const DEFAULT_PANTRY: Pantry = {
  staples: [
    { name: 'olive oil' }, { name: 'salt' }, { name: 'black pepper' },
    { name: 'garlic' }, { name: 'cumin' }, { name: 'ground coriander' },
    { name: 'turmeric' }, { name: 'smoked paprika' }, { name: 'chilli flakes' },
    { name: 'bay leaves' }, { name: 'tinned tomatoes' }, { name: 'vegetable stock' },
    { name: 'soy sauce' }, { name: 'apple cider vinegar' },
  ],
  regulars: [
    { name: 'eggs', level: 'full' },
    { name: 'tinned sardines', level: 'full' },
    { name: 'tinned salmon', level: 'full' },
    { name: 'greek yoghurt', level: 'full' },
    { name: 'leafy greens', level: 'full' },
    { name: 'green lentils', level: 'full' },
    { name: 'black lentils', level: 'full' },
    { name: 'onions', level: 'full' },
    { name: 'lemons', level: 'full' },
  ],
  variables: [],
};

export const DEFAULT_RECIPES: Recipe[] = [
  {
    id: uuidv4(),
    title: 'Red Lentil Dal',
    description: 'A hearty, batch-cook vegetarian dal perfect for meal prep.',
    servings: 4,
    prepTime: 10,
    cookTime: 30,
    ingredients: [
      { itemName: 'red lentils', amount: 300, unit: 'g', tier: 3 },
      { itemName: 'onions', amount: 2, unit: 'whole', tier: 2 },
      { itemName: 'garlic', amount: 4, unit: 'whole', tier: 1 },
      { itemName: 'cumin', amount: 2, unit: 'tsp', tier: 1 },
      { itemName: 'ground coriander', amount: 1, unit: 'tsp', tier: 1 },
      { itemName: 'turmeric', amount: 1, unit: 'tsp', tier: 1 },
      { itemName: 'olive oil', amount: 2, unit: 'tbsp', tier: 1 },
      { itemName: 'tinned tomatoes', amount: 400, unit: 'g', tier: 1 },
      { itemName: 'vegetable stock', amount: 600, unit: 'ml', tier: 1 },
    ],
    steps: [
      { id: uuidv4(), text: 'Heat olive oil in a large pot over medium heat.' },
      { id: uuidv4(), text: 'Dice onions and fry for 8 minutes until soft and golden.', timerSeconds: 480 },
      { id: uuidv4(), text: 'Add minced garlic, cumin, coriander, and turmeric. Stir for 1 minute.', timerSeconds: 60 },
      { id: uuidv4(), text: 'Add rinsed red lentils, tinned tomatoes, and vegetable stock. Stir well.' },
      { id: uuidv4(), text: 'Bring to a boil, then simmer for 20 minutes until lentils are soft.', timerSeconds: 1200 },
      { id: uuidv4(), text: 'Season with salt and black pepper. Serve or batch into containers.' },
    ],
    tags: ['vegetarian', 'batch-cook', 'dinner', 'high-protein'],
    macrosPerServing: { protein: 18, carbs: 45, fat: 6, fibre: 12 },
    microsPerServing: { iron: 4.5, vitaminC: 8, zinc: 2.5 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: 'Green Lentil Salad',
    description: 'A quick, nutritious salad using pantry regulars.',
    servings: 2,
    prepTime: 15,
    cookTime: 20,
    ingredients: [
      { itemName: 'green lentils', amount: 200, unit: 'g', tier: 2 },
      { itemName: 'leafy greens', amount: 2, unit: 'whole', tier: 2 },
      { itemName: 'lemons', amount: 1, unit: 'whole', tier: 2 },
      { itemName: 'olive oil', amount: 3, unit: 'tbsp', tier: 1 },
      { itemName: 'salt', amount: 1, unit: 'tsp', tier: 1 },
      { itemName: 'black pepper', amount: 1, unit: 'tsp', tier: 1 },
      { itemName: 'tinned sardines', amount: 1, unit: 'whole', tier: 2, optional: true },
    ],
    steps: [
      { id: uuidv4(), text: 'Cook green lentils in boiling salted water for 20 minutes until tender.', timerSeconds: 1200 },
      { id: uuidv4(), text: 'Drain and cool lentils slightly.' },
      { id: uuidv4(), text: 'Toss with leafy greens, lemon juice, olive oil, salt, and pepper.' },
      { id: uuidv4(), text: 'Top with flaked sardines if desired. Serve immediately.' },
    ],
    tags: ['quick', 'vegetarian', 'lunch', 'high-fibre'],
    macrosPerServing: { protein: 22, carbs: 38, fat: 10, fibre: 14 },
    microsPerServing: { iron: 5.5, vitaminC: 25, calcium: 120, zinc: 3 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const DAILY_TARGETS = {
  protein: 50, carbs: 260, fat: 70, fibre: 30,
  iron: 8.7, calcium: 700, vitaminC: 40, vitaminD: 10, b12: 2.4, zinc: 9.5,
};
