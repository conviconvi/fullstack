import { useEffect, useMemo, useState } from 'react';

const API = '/api';

const defaultForm = {
  amount: '',
  category: 'Продукты',
  notes: '',
  spentAt: new Date().toISOString().slice(0, 10),
};

const currency = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
});

export default function App() {
  const [form, setForm] = useState(defaultForm);
  const [expenses, setExpenses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function loadAll() {
    setLoading(true);
    setErr('');
    try {
      const [expRes, anaRes] = await Promise.all([
        fetch(`${API}/expenses`),
        fetch(`${API}/analytics`),
      ]);
      if (!expRes.ok || !anaRes.ok) throw new Error('Ошибка загрузки данных');
      setExpenses(await expRes.json());
      setAnalytics(await anaRes.json());
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function submitExpense(e) {
    e.preventDefault();
    setErr('');

    try {
      const res = await fetch(`${API}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Не удалось сохранить расход');
      }

      setForm(defaultForm);
      await loadAll();
    } catch (e) {
      setErr(e.message);
    }
  }

  const chartRows = useMemo(() => {
    if (!analytics?.byCategory) return [];
    return Object.entries(analytics.byCategory).sort((a, b) => b[1] - a[1]);
  }, [analytics]);

  return (
    <div className="page">
      <header>
        <h1>Аналитика расходов + ИИ-бухгалтер</h1>
        <p>Добавляйте траты и получайте персональные рекомендации по экономии.</p>
      </header>

      <section className="card">
        <h2>Новый расход</h2>
        <form onSubmit={submitExpense} className="form-grid">
          <input
            type="number"
            placeholder="Сумма"
            min="1"
            required
            value={form.amount}
            onChange={(e) => setForm((s) => ({ ...s, amount: e.target.value }))}
          />

          <select
            value={form.category}
            onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}
          >
            <option>Продукты</option>
            <option>Транспорт</option>
            <option>Рестораны</option>
            <option>Здоровье</option>
            <option>Развлечения</option>
            <option>Подписки</option>
            <option>Другое</option>
          </select>

          <input
            type="date"
            required
            value={form.spentAt}
            onChange={(e) => setForm((s) => ({ ...s, spentAt: e.target.value }))}
          />

          <input
            type="text"
            placeholder="Комментарий"
            value={form.notes}
            onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
          />

          <button type="submit">Сохранить</button>
        </form>
      </section>

      {err && <div className="error">{err}</div>}

      <section className="grid">
        <article className="card">
          <h2>Сводка за {analytics?.month || '—'}</h2>
          <p className="big">{analytics ? currency.format(analytics.monthlyTotal) : '—'}</p>
          <p>
            Топ категория:{' '}
            {analytics?.topCategory ? `${analytics.topCategory[0]} (${currency.format(analytics.topCategory[1])})` : '—'}
          </p>
        </article>

        <article className="card">
          <h2>По категориям</h2>
          <ul className="category-list">
            {chartRows.map(([name, total]) => (
              <li key={name}>
                <span>{name}</span>
                <strong>{currency.format(total)}</strong>
              </li>
            ))}
            {!chartRows.length && <li>Пока нет данных</li>}
          </ul>
        </article>
      </section>

      <section className="card">
        <h2>Совет от ИИ-бухгалтера</h2>
        <pre>{analytics?.coach?.advice || 'Загружаем...'}</pre>
      </section>

      <section className="card">
        <h2>Последние операции</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Дата</th>
                <th>Категория</th>
                <th>Сумма</th>
                <th>Комментарий</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((item) => (
                <tr key={item.id}>
                  <td>{item.spentAt}</td>
                  <td>{item.category}</td>
                  <td>{currency.format(item.amount)}</td>
                  <td>{item.notes || '—'}</td>
                </tr>
              ))}
              {!expenses.length && (
                <tr>
                  <td colSpan="4">Пока нет расходов</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {loading && <div className="loading">Обновляем данные…</div>}
    </div>
  );
}
