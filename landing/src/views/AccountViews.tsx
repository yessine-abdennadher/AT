import { FavoritesView } from './FavoritesView';
import { ProfileView } from './ProfileView';

export { FavoritesView } from './FavoritesView';
export { ProfileView } from './ProfileView';

interface AccountViewsProps {
  page: 'profile' | 'favorites';
}

/**
 * AccountViews facade
 * Rétro-compatibilité pour les routes ou imports historiques.
 * Délègue proprement aux vues spécialisées FavoritesView et ProfileView.
 */
export function AccountViews({ page }: AccountViewsProps) {
  if (page === 'favorites') {
    return <FavoritesView />;
  }
  return <ProfileView />;
}
