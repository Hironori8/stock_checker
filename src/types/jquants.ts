export interface RefreshTokenRequest {
  mailaddress: string;
  password: string;
}

export interface RefreshTokenResponse {
  refreshToken: string;
}

export interface IdTokenResponse {
  idToken: string;
}

export interface CompanyInfo {
  Code: string;
  CompanyName: string;
  CompanyNameEnglish: string;
  Sector17Code: string;
  Sector17CodeName: string;
  Sector33Code: string;
  Sector33CodeName: string;
  ScaleCategory: string;
  MarketCode: string;
  MarketCodeName: string;
}

export interface CompanyListResponse {
  info: CompanyInfo[];
}

export interface FinancialStatement {
  DisclosureNumber: string;
  DisclosedDate: string;
  ApplyingOfSpecificAccountingOfTheQuarterlyFinancialStatements: boolean;
  CurrentPeriodEndDate: string;
  LocalCode: string;
  TypeOfDocument: string;
  TypeOfCurrentPeriod: string;
  CurrentFiscalYearEndDate: string;
  CurrentFiscalYearStartDate: string;
  NetSales?: number;
  OperatingProfit?: number;
  OrdinaryProfit?: number;
  Profit?: number;
  EarningsPerShare?: number;
  TotalAssets?: number;
  Equity?: number;
  EquityToAssetRatio?: number;
  BookValuePerShare?: number;
  CashFlowsFromOperatingActivities?: number;
  CashFlowsFromInvestingActivities?: number;
  CashFlowsFromFinancingActivities?: number;
  CashAndEquivalents?: number;
  ResultDividendPerShareAnnual?: number;
  ResultPayoutRatioAnnual?: number;
  ForecastDividendPerShareAnnual?: number;
  ForecastPayoutRatioAnnual?: number;
  NextYearForecastDividendPerShareAnnual?: number;
  NextYearForecastPayoutRatioAnnual?: number;
  ForecastTotalDividendPaidAnnual?: number;
  ForecastPayoutRatioAnnual_2?: number;
  NumberOfIssuedAndOutstandingSharesAtTheEndOfFiscalYearIncludingTreasuryStock?: number;
}

export interface StatementsResponse {
  statements: FinancialStatement[];
}

export interface DailyQuote {
  Date: string;
  Code: string;
  Open: number;
  High: number;
  Low: number;
  Close: number;
  Volume: number;
  TurnoverValue: number;
  AdjustmentFactor: number;
  AdjustmentOpen: number;
  AdjustmentHigh: number;
  AdjustmentLow: number;
  AdjustmentClose: number;
  AdjustmentVolume: number;
}

export interface DailyQuotesResponse {
  daily_quotes: DailyQuote[];
}