import { ISearchProvider } from '../ISearchProvider';
import { TavilyProvider } from './Tavily';
import { ExaProvider } from './Exa';

export type ProviderType = 'tavily' | 'exa';

export function getSearchProvider(type: ProviderType = 'tavily'): ISearchProvider {
  switch (type) {
    case 'tavily':
      return new TavilyProvider();
    case 'exa':
      return new ExaProvider();
    default:
      throw new Error(`Unknown provider: ${type}`);
  }
}
