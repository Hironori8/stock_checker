export interface FinancialIndicators {
  code: string;
  companyName: string;
  sector: string;
  market: string;
  
  // 実績指標
  roe?: number;              // 自己資本利益率
  roa?: number;              // 総資産利益率
  operatingProfitMargin?: number;  // 営業利益率
  equityRatio?: number;      // 自己資本比率
  salesGrowthRate?: number;  // 売上高成長率
  
  // 評価指標
  per?: number;              // 株価収益率
  pbr?: number;              // 株価純資産倍率
  dividendYield?: number;    // 配当利回り
  marketCap?: number;        // 時価総額
  
  // 株価情報
  currentPrice?: number;
  priceDate?: string;
  
  // 財務データ
  netSales?: number;
  operatingProfit?: number;
  netProfit?: number;
  totalAssets?: number;
  equity?: number;
  sharesOutstanding?: number;
  eps?: number;              // 1株当たり純利益
  bps?: number;              // 1株当たり純資産
}

export interface ScreeningCriteria {
  // 実績の良さ
  minRoe?: number;
  minOperatingProfitMargin?: number;
  minEquityRatio?: number;
  minSalesGrowthRate?: number;
  
  // 評価の低さ
  maxPer?: number;
  maxPbr?: number;
  minDividendYield?: number;
  
  // 時価総額フィルタ
  minMarketCap?: number;
  maxMarketCap?: number;
  
  // その他のフィルタ
  sectors?: string[];
  markets?: string[];
}