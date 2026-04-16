import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function buildCoachAdvice({ expenses, monthlyTotal, byCategory }) {
  if (!openai) {
    return {
      mode: 'fallback',
      advice:
        'AI-ключ не настроен. Добавьте OPENAI_API_KEY, чтобы получать персональные рекомендации.',
    };
  }

  const prompt = {
    role: 'user',
    content: [
      'Ты — личный финансовый ассистент (личный бухгалтер).',
      'Проанализируй траты и дай короткий, практичный план.',
      'Формат ответа: 1) Риски 2) Что сократить 3) План на 7 дней 4) Финансовая привычка.',
      `Сумма за месяц: ${monthlyTotal}`,
      `Категории: ${JSON.stringify(byCategory)}`,
      `Последние траты: ${JSON.stringify(expenses.slice(0, 25))}`,
    ].join('\n'),
  };

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'Отвечай на русском языке. Будь конкретным, с цифрами и выполнимыми шагами.',
      },
      prompt,
    ],
    temperature: 0.4,
  });

  return {
    mode: 'openai',
    advice: response.choices?.[0]?.message?.content?.trim() || 'Не удалось получить ответ ИИ.',
  };
}
