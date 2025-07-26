import { FinancialStatement, DailyQuote, CompanyInfo } from '../types/jquants';
import { FinancialIndicators, ScreeningCriteria } from '../types/indicators';

export function calculateIndicators(
  company: CompanyInfo,
  statements: FinancialStatement[],
  quotes: DailyQuote[]
): FinancialIndicators {
  // 最新の財務データを取得（年次決算を優先）
  const latestStatement = statements
    .filter(s => s.TypeOfCurrentPeriod === 'FY' || s.TypeOfCurrentPeriod === 'Annual')
    .sort((a, b) => b.CurrentPeriodEndDate.localeCompare(a.CurrentPeriodEndDate))[0];
  
  // 前年の財務データを取得
  const previousYearStatement = statements
    .filter(s => (s.TypeOfCurrentPeriod === 'FY' || s.TypeOfCurrentPeriod === 'Annual') && 
                 s.CurrentFiscalYearEndDate < latestStatement?.CurrentFiscalYearEndDate)
    .sort((a, b) => b.CurrentPeriodEndDate.localeCompare(a.CurrentPeriodEndDate))[0];
  
  // 最新の株価を取得
  const latestQuote = quotes.sort((a, b) => b.Date.localeCompare(a.Date))[0];
  
  const indicators: FinancialIndicators = {
    code: company.Code,
    companyName: company.CompanyName,
    sector: company.Sector33CodeName,
    market: company.MarketCodeName,
  };
  
  if (!latestStatement) {
    return indicators;
  }
  
  // 基本的な財務データ
  indicators.netSales = latestStatement.NetSales;
  indicators.operatingProfit = latestStatement.OperatingProfit;
  indicators.netProfit = latestStatement.Profit;
  indicators.totalAssets = latestStatement.TotalAssets;
  indicators.equity = latestStatement.Equity;
  indicators.sharesOutstanding = latestStatement.NumberOfIssuedAndOutstandingSharesAtTheEndOfFiscalYearIncludingTreasuryStock;
  indicators.eps = latestStatement.EarningsPerShare;
  indicators.bps = latestStatement.BookValuePerShare;
  
  // ROE（自己資本利益率）
  if (latestStatement.Profit && latestStatement.Equity && latestStatement.Equity !== 0) {
    indicators.roe = (latestStatement.Profit / latestStatement.Equity) * 100;
  }
  
  // ROA（総資産利益率）
  if (latestStatement.Profit && latestStatement.TotalAssets && latestStatement.TotalAssets !== 0) {
    indicators.roa = (latestStatement.Profit / latestStatement.TotalAssets) * 100;
  }
  
  // 営業利益率
  if (latestStatement.OperatingProfit && latestStatement.NetSales && latestStatement.NetSales !== 0) {
    indicators.operatingProfitMargin = (latestStatement.OperatingProfit / latestStatement.NetSales) * 100;
  }
  
  // 自己資本比率
  if (latestStatement.EquityToAssetRatio !== undefined && latestStatement.EquityToAssetRatio !== null && latestStatement.EquityToAssetRatio !== 0) {
    // APIが小数で返す場合は100を掛ける（0.45 -> 45%）
    indicators.equityRatio = latestStatement.EquityToAssetRatio < 1 ? latestStatement.EquityToAssetRatio * 100 : latestStatement.EquityToAssetRatio;
  } else if (latestStatement.Equity && latestStatement.TotalAssets && latestStatement.TotalAssets !== 0) {
    // APIから値が取得できない場合は自分で計算
    indicators.equityRatio = (latestStatement.Equity / latestStatement.TotalAssets) * 100;
  }
  
  // 売上高成長率
  if (previousYearStatement?.NetSales && latestStatement.NetSales && previousYearStatement.NetSales !== 0) {
    indicators.salesGrowthRate = ((latestStatement.NetSales - previousYearStatement.NetSales) / previousYearStatement.NetSales) * 100;
  }
  
  if (latestQuote) {
    indicators.currentPrice = latestQuote.AdjustmentClose;
    indicators.priceDate = latestQuote.Date;
    
    // PER（株価収益率）
    if (latestStatement.EarningsPerShare && latestStatement.EarningsPerShare > 0) {
      indicators.per = latestQuote.AdjustmentClose / latestStatement.EarningsPerShare;
    }
    
    // PBR（株価純資産倍率）
    if (latestStatement.BookValuePerShare && latestStatement.BookValuePerShare > 0) {
      indicators.pbr = latestQuote.AdjustmentClose / latestStatement.BookValuePerShare;
    }
    
    // 配当利回り
    if (latestStatement.ResultDividendPerShareAnnual && latestStatement.ResultDividendPerShareAnnual > 0 && latestQuote.AdjustmentClose > 0) {
      indicators.dividendYield = (latestStatement.ResultDividendPerShareAnnual / latestQuote.AdjustmentClose) * 100;
    }
    
    // 時価総額（百万円）
    if (latestStatement.NumberOfIssuedAndOutstandingSharesAtTheEndOfFiscalYearIncludingTreasuryStock && latestStatement.NumberOfIssuedAndOutstandingSharesAtTheEndOfFiscalYearIncludingTreasuryStock > 0) {
      indicators.marketCap = (latestQuote.AdjustmentClose * latestStatement.NumberOfIssuedAndOutstandingSharesAtTheEndOfFiscalYearIncludingTreasuryStock) / 1000000;
    }
  }
  
  return indicators;
}

export function screenStocks(
  indicators: FinancialIndicators[],
  criteria: ScreeningCriteria
): FinancialIndicators[] {
  return indicators.filter(stock => {
    // 必要な指標が有効な値（undefined、null、0以外）を持っているかチェック
    const hasValidRoe = stock.roe !== undefined && stock.roe !== null && stock.roe !== 0;
    const hasValidPer = stock.per !== undefined && stock.per !== null && stock.per !== 0;
    const hasValidPbr = stock.pbr !== undefined && stock.pbr !== null && stock.pbr !== 0;
    const hasValidOperatingMargin = stock.operatingProfitMargin !== undefined && stock.operatingProfitMargin !== null && stock.operatingProfitMargin !== 0;
    const hasValidEquityRatio = stock.equityRatio !== undefined && stock.equityRatio !== null && stock.equityRatio !== 0;
    const hasValidMarketCap = stock.marketCap !== undefined && stock.marketCap !== null && stock.marketCap > 0;
    
    // 最低限必要な指標（PERとPBR）が有効でない場合は除外
    if (!hasValidPer || !hasValidPbr) return false;
    
    // 実績の良さ（値が存在し、0でない場合のみチェック）
    if (criteria.minRoe && hasValidRoe && stock.roe! < criteria.minRoe) return false;
    if (criteria.minOperatingProfitMargin && hasValidOperatingMargin && stock.operatingProfitMargin! < criteria.minOperatingProfitMargin) return false;
    if (criteria.minEquityRatio && hasValidEquityRatio && stock.equityRatio! < criteria.minEquityRatio) return false;
    if (criteria.minSalesGrowthRate && stock.salesGrowthRate !== undefined && stock.salesGrowthRate !== null && stock.salesGrowthRate < criteria.minSalesGrowthRate) return false;
    
    // 評価の低さ（PERとPBRは必須なのでチェック済み）
    if (criteria.maxPer && stock.per! > criteria.maxPer) return false;
    if (criteria.maxPbr && stock.pbr! > criteria.maxPbr) return false;
    if (criteria.minDividendYield && (stock.dividendYield === undefined || stock.dividendYield === null || stock.dividendYield < criteria.minDividendYield)) return false;
    
    // 時価総額フィルタ
    if (criteria.minMarketCap && (!hasValidMarketCap || stock.marketCap! < criteria.minMarketCap)) return false;
    if (criteria.maxMarketCap && (!hasValidMarketCap || stock.marketCap! > criteria.maxMarketCap)) return false;
    
    // セクターフィルタ
    if (criteria.sectors && criteria.sectors.length > 0 && !criteria.sectors.includes(stock.sector)) return false;
    
    // 市場フィルタ
    if (criteria.markets && criteria.markets.length > 0 && !criteria.markets.includes(stock.market)) return false;
    
    return true;
  });
}