import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getRecommendations, type RecommendationFilters } from '../services/recommendationService';
import { apiRequest } from '../services/apiClient';
import { mapBackendToActivity, type ExplorerOption } from '../services/activityApi';
import type { DemoActivity } from '../data/demoActivities';

export function RecommendationsView() {
  const { t } = useLanguage();
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [situation, setSituation] = useState<'' | 'surprise_me' | 'hot' | 'rain' | 'open_now' | 'powercut'>('');
  const [sortBy, setSortBy] = useState<'rating' | 'price' | 'distance'>('rating');
  const [cities, setCities] = useState<ExplorerOption[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<DemoActivity[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let alive = true;
    apiRequest<{ cities?: Array<{ slug: string; nameFr?: string; name?: string; isActive?: boolean }> }>('/cities?activeOnly=true')
      .then((payload) => { if (alive) setCities((payload.cities || []).filter((item) => item.isActive !== false).map((item) => ({ value: item.nameFr || item.name || item.slug, label: item.nameFr || item.name || item.slug }))); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  const currentFilters = (): RecommendationFilters => ({
    ...(city ? { city } : {}), ...(category ? { category } : {}), ...(maxPrice ? { budgetMax: Number(maxPrice) } : {}), ...(situation ? { situation } : {}),
  });
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const payload = await getRecommendations(currentFilters(), sortBy, 1);
      setResults(payload.activities.map((activity) => mapBackendToActivity(activity)));
      setPage(payload.page); setHasMore(payload.hasMore); setSubmitted(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : t('recommendations.error')); }
    finally { setBusy(false); }
  };
  const loadMore = async () => {
    setBusy(true); setError('');
    try {
      const payload = await getRecommendations(currentFilters(), sortBy, page + 1);
      setResults((current) => [...current, ...payload.activities.map((activity) => mapBackendToActivity(activity))]);
      setPage(payload.page); setHasMore(payload.hasMore);
    } catch (cause) { setError(cause instanceof Error ? cause.message : t('recommendations.error')); }
    finally { setBusy(false); }
  };
  return <section className="public-page"><h1>{t('nav.recommendations')}</h1>
    <form className="profile-form" onSubmit={submit}>
      <label>{t('account.preferredCity')}<select value={city} onChange={(event) => setCity(event.target.value)}><option value="">{t('recommendations.anyCity')}</option>{cities.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      <label>{t('explorer.categoryFilter')}<select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">{t('explorer.allCategories')}</option>{['fun','food','outdoor','creative','sport','couple','friends'].map((value) => <option key={value} value={value}>{t(`explorer.categoryNames.${value}`)}</option>)}</select></label>
      <label>{t('recommendations.maxBudget')}<input type="number" min="0" step="1" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} /></label>
      <label>{t('recommendations.situation')}<select value={situation} onChange={(event) => setSituation(event.target.value as typeof situation)}><option value="">{t('recommendations.anySituation')}</option>{['surprise_me','hot','rain','open_now','powercut'].map((value) => <option key={value} value={value}>{t(`recommendations.situations.${value}`)}</option>)}</select></label>
      <label>{t('recommendations.sort')}<select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)}><option value="rating">{t('recommendations.sortRating')}</option><option value="price">{t('recommendations.sortPrice')}</option><option value="distance">{t('recommendations.sortDistance')}</option></select></label>
      <button className="btn btn-primary" disabled={busy}>{busy ? t('auth.working') : t('recommendations.submit')}</button>
    </form>
    {error && <p role="alert">{error}</p>}{submitted && !busy && !error && results.length === 0 && <p>{t('recommendations.empty')}</p>}
    <div className="account-activity-list">{results.map((activity) => <Link key={activity.id} to={`/activites/${encodeURIComponent(activity.id)}`}>{activity.name} · {activity.price} DT · {activity.city}</Link>)}</div>
    {hasMore && <button className="btn btn-secondary" type="button" disabled={busy} onClick={() => void loadMore()}>{t('recommendations.loadMore')}</button>}
  </section>;
}

