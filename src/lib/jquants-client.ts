import axios, { AxiosInstance } from 'axios';
import {
  RefreshTokenRequest,
  RefreshTokenResponse,
  IdTokenResponse,
  CompanyListResponse,
  StatementsResponse,
  DailyQuotesResponse,
  CompanyInfo,
  FinancialStatement,
  DailyQuote,
} from '../types/jquants';
import { CsvCache } from './csv-cache';

export class JQuantsClient {
  private readonly client: AxiosInstance;
  private idToken: string | null = null;
  private readonly cache: CsvCache;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.jquants.com/v1',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    this.cache = new CsvCache();
  }

  async getRefreshToken(email: string, password: string): Promise<string> {
    try {
      const response = await this.client.post<RefreshTokenResponse>(
        '/token/auth_user',
        {
          mailaddress: email,
          password: password,
        } as RefreshTokenRequest
      );
      return response.data.refreshToken;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to get refresh token: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }

  async getIdToken(refreshToken: string): Promise<string> {
    try {
      const response = await this.client.post<IdTokenResponse>(
        '/token/auth_refresh',
        {},
        {
          params: {
            refreshtoken: refreshToken,
          },
        }
      );
      this.idToken = response.data.idToken;
      return response.data.idToken;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to get ID token: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }

  async authenticate(email: string, password: string): Promise<string> {
    const refreshToken = await this.getRefreshToken(email, password);
    const idToken = await this.getIdToken(refreshToken);
    return idToken;
  }

  async getCompanyList(): Promise<CompanyListResponse> {
    if (!this.idToken) {
      throw new Error('Not authenticated. Please call authenticate() first.');
    }

    try {
      const response = await this.client.get<CompanyListResponse>(
        '/listed/info',
        {
          headers: {
            Authorization: `Bearer ${this.idToken}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to get company list: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }

  async getStatements(code?: string): Promise<StatementsResponse> {
    if (!this.idToken) {
      throw new Error('Not authenticated. Please call authenticate() first.');
    }

    try {
      const params: any = {};
      if (code) {
        params.code = code;
      }

      const response = await this.client.get<StatementsResponse>(
        '/fins/statements',
        {
          headers: {
            Authorization: `Bearer ${this.idToken}`,
          },
          params,
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to get statements: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }

  async getDailyQuotes(code: string, from?: string, to?: string): Promise<DailyQuotesResponse> {
    if (!this.idToken) {
      throw new Error('Not authenticated. Please call authenticate() first.');
    }

    try {
      const params: any = { code };
      if (from) params.from = from;
      if (to) params.to = to;

      const response = await this.client.get<DailyQuotesResponse>(
        '/prices/daily_quotes',
        {
          headers: {
            Authorization: `Bearer ${this.idToken}`,
          },
          params,
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to get daily quotes: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }

  // Cache management methods
  getCacheInfo() {
    return this.cache.getCacheInfo();
  }

  clearCache() {
    this.cache.clearCache();
  }

  // Load data from cache
  loadCachedData(): {
    companies: CompanyInfo[] | null;
    statements: FinancialStatement[] | null;
    quotes: DailyQuote[] | null;
  } {
    return this.cache.loadAllData();
  }

  // Save data to cache
  saveToCache(
    companies: CompanyInfo[],
    statements: FinancialStatement[],
    quotes: DailyQuote[]
  ) {
    this.cache.saveAllData(companies, statements, quotes);
  }

  // Cached version of getCompanyList
  async getCachedCompanyList(useCache: boolean = true): Promise<CompanyListResponse> {
    if (useCache) {
      const cached = this.cache.loadCompanyInfo();
      if (cached) {
        console.log('Loading company list from cache...');
        return { info: cached };
      }
    }

    console.log('Fetching company list from API...');
    const response = await this.getCompanyList();
    
    // Save to cache
    if (response.info) {
      this.cache.saveCompanyInfo(response.info);
    }
    
    return response;
  }

  // Batch fetch statements with caching
  async getCachedStatements(
    codes: string[],
    useCache: boolean = true
  ): Promise<FinancialStatement[]> {
    if (useCache) {
      const cached = this.cache.loadFinancialStatements();
      if (cached) {
        console.log('Loading financial statements from cache...');
        // Filter for requested codes if specified
        if (codes.length > 0) {
          return cached.filter(stmt => codes.includes(stmt.LocalCode));
        }
        return cached;
      }
    }

    console.log('Fetching financial statements from API...');
    const allStatements: FinancialStatement[] = [];
    
    // Fetch in batches
    const batchSize = 10;
    for (let i = 0; i < codes.length; i += batchSize) {
      const batch = codes.slice(i, i + batchSize);
      const promises = batch.map(code => this.getStatements(code));
      
      const results = await Promise.all(promises);
      for (const result of results) {
        if (result.statements) {
          allStatements.push(...result.statements);
        }
      }
      
      // Log progress
      console.log(`Fetched statements for ${Math.min(i + batchSize, codes.length)}/${codes.length} companies`);
    }
    
    // Save to cache
    this.cache.saveFinancialStatements(allStatements);
    
    return allStatements;
  }

  // Batch fetch quotes with caching
  async getCachedDailyQuotes(
    codes: string[],
    from?: string,
    to?: string,
    useCache: boolean = true
  ): Promise<DailyQuote[]> {
    if (useCache && !from && !to) {
      const cached = this.cache.loadDailyQuotes();
      if (cached) {
        console.log('Loading daily quotes from cache...');
        // Filter for requested codes if specified
        if (codes.length > 0) {
          return cached.filter(quote => codes.includes(quote.Code));
        }
        return cached;
      }
    }

    console.log('Fetching daily quotes from API...');
    const allQuotes: DailyQuote[] = [];
    
    // Fetch in batches
    const batchSize = 10;
    for (let i = 0; i < codes.length; i += batchSize) {
      const batch = codes.slice(i, i + batchSize);
      const promises = batch.map(code => this.getDailyQuotes(code, from, to));
      
      const results = await Promise.all(promises);
      for (const result of results) {
        if (result.daily_quotes) {
          allQuotes.push(...result.daily_quotes);
        }
      }
      
      // Log progress
      console.log(`Fetched quotes for ${Math.min(i + batchSize, codes.length)}/${codes.length} companies`);
    }
    
    // Save to cache (only if not using date filters)
    if (!from && !to) {
      this.cache.saveDailyQuotes(allQuotes);
    }
    
    return allQuotes;
  }
}