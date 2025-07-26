import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { CompanyInfo, FinancialStatement, DailyQuote } from '../types/jquants';

const CACHE_DIR = path.join(process.cwd(), '.cache');
const COMPANY_INFO_FILE = 'company_info.csv';
const FINANCIAL_STATEMENTS_FILE = 'financial_statements.csv';
const DAILY_QUOTES_FILE = 'daily_quotes.csv';

export class CsvCache {
  constructor() {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
  }

  private getFilePath(filename: string): string {
    return path.join(CACHE_DIR, filename);
  }

  saveCompanyInfo(companies: CompanyInfo[]): void {
    const data = companies.map(company => ({
      Code: company.Code,
      CompanyName: company.CompanyName,
      CompanyNameEnglish: company.CompanyNameEnglish,
      Sector17Code: company.Sector17Code,
      Sector17CodeName: company.Sector17CodeName,
      Sector33Code: company.Sector33Code,
      Sector33CodeName: company.Sector33CodeName,
      ScaleCategory: company.ScaleCategory,
      MarketCode: company.MarketCode,
      MarketCodeName: company.MarketCodeName,
      lastUpdated: new Date().toISOString(),
    }));

    const csv = stringify(data, { header: true });
    fs.writeFileSync(this.getFilePath(COMPANY_INFO_FILE), csv);
  }

  loadCompanyInfo(): CompanyInfo[] | null {
    const filePath = this.getFilePath(COMPANY_INFO_FILE);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const records = parse(content, { columns: true });
    
    return records.map((record: any) => ({
      Code: record.Code,
      CompanyName: record.CompanyName,
      CompanyNameEnglish: record.CompanyNameEnglish,
      Sector17Code: record.Sector17Code,
      Sector17CodeName: record.Sector17CodeName,
      Sector33Code: record.Sector33Code,
      Sector33CodeName: record.Sector33CodeName,
      ScaleCategory: record.ScaleCategory,
      MarketCode: record.MarketCode,
      MarketCodeName: record.MarketCodeName,
    }));
  }

  saveFinancialStatements(statements: FinancialStatement[]): void {
    const data = statements.map(stmt => ({
      LocalCode: stmt.LocalCode,
      DisclosedDate: stmt.DisclosedDate,
      DisclosureNumber: stmt.DisclosureNumber,
      TypeOfDocument: stmt.TypeOfDocument,
      TypeOfCurrentPeriod: stmt.TypeOfCurrentPeriod,
      CurrentPeriodEndDate: stmt.CurrentPeriodEndDate,
      CurrentFiscalYearStartDate: stmt.CurrentFiscalYearStartDate,
      CurrentFiscalYearEndDate: stmt.CurrentFiscalYearEndDate,
      ApplyingOfSpecificAccountingOfTheQuarterlyFinancialStatements: stmt.ApplyingOfSpecificAccountingOfTheQuarterlyFinancialStatements,
      NetSales: stmt.NetSales,
      OperatingProfit: stmt.OperatingProfit,
      OrdinaryProfit: stmt.OrdinaryProfit,
      Profit: stmt.Profit,
      EarningsPerShare: stmt.EarningsPerShare,
      TotalAssets: stmt.TotalAssets,
      Equity: stmt.Equity,
      EquityToAssetRatio: stmt.EquityToAssetRatio,
      BookValuePerShare: stmt.BookValuePerShare,
      CashFlowsFromOperatingActivities: stmt.CashFlowsFromOperatingActivities,
      CashFlowsFromInvestingActivities: stmt.CashFlowsFromInvestingActivities,
      CashFlowsFromFinancingActivities: stmt.CashFlowsFromFinancingActivities,
      NumberOfIssuedAndOutstandingSharesAtTheEndOfFiscalYearIncludingTreasuryStock: stmt.NumberOfIssuedAndOutstandingSharesAtTheEndOfFiscalYearIncludingTreasuryStock,
      lastUpdated: new Date().toISOString(),
    }));

    const csv = stringify(data, { header: true });
    fs.writeFileSync(this.getFilePath(FINANCIAL_STATEMENTS_FILE), csv);
  }

  loadFinancialStatements(): FinancialStatement[] | null {
    const filePath = this.getFilePath(FINANCIAL_STATEMENTS_FILE);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const records = parse(content, { columns: true });
    
    return records.map((record: any) => ({
      LocalCode: record.LocalCode,
      DisclosedDate: record.DisclosedDate,
      DisclosureNumber: record.DisclosureNumber,
      TypeOfDocument: record.TypeOfDocument,
      TypeOfCurrentPeriod: record.TypeOfCurrentPeriod,
      CurrentPeriodEndDate: record.CurrentPeriodEndDate,
      CurrentFiscalYearStartDate: record.CurrentFiscalYearStartDate,
      CurrentFiscalYearEndDate: record.CurrentFiscalYearEndDate,
      ApplyingOfSpecificAccountingOfTheQuarterlyFinancialStatements: record.ApplyingOfSpecificAccountingOfTheQuarterlyFinancialStatements === 'true',
      NetSales: record.NetSales ? parseFloat(record.NetSales) : undefined,
      OperatingProfit: record.OperatingProfit ? parseFloat(record.OperatingProfit) : undefined,
      OrdinaryProfit: record.OrdinaryProfit ? parseFloat(record.OrdinaryProfit) : undefined,
      Profit: record.Profit ? parseFloat(record.Profit) : undefined,
      EarningsPerShare: record.EarningsPerShare ? parseFloat(record.EarningsPerShare) : undefined,
      TotalAssets: record.TotalAssets ? parseFloat(record.TotalAssets) : undefined,
      Equity: record.Equity ? parseFloat(record.Equity) : undefined,
      EquityToAssetRatio: record.EquityToAssetRatio ? parseFloat(record.EquityToAssetRatio) : undefined,
      BookValuePerShare: record.BookValuePerShare ? parseFloat(record.BookValuePerShare) : undefined,
      CashFlowsFromOperatingActivities: record.CashFlowsFromOperatingActivities ? parseFloat(record.CashFlowsFromOperatingActivities) : undefined,
      CashFlowsFromInvestingActivities: record.CashFlowsFromInvestingActivities ? parseFloat(record.CashFlowsFromInvestingActivities) : undefined,
      CashFlowsFromFinancingActivities: record.CashFlowsFromFinancingActivities ? parseFloat(record.CashFlowsFromFinancingActivities) : undefined,
      NumberOfIssuedAndOutstandingSharesAtTheEndOfFiscalYearIncludingTreasuryStock: record.NumberOfIssuedAndOutstandingSharesAtTheEndOfFiscalYearIncludingTreasuryStock ? parseFloat(record.NumberOfIssuedAndOutstandingSharesAtTheEndOfFiscalYearIncludingTreasuryStock) : undefined,
    }));
  }

  saveDailyQuotes(quotes: DailyQuote[]): void {
    const data = quotes.map(quote => ({
      Code: quote.Code,
      Date: quote.Date,
      Open: quote.Open,
      High: quote.High,
      Low: quote.Low,
      Close: quote.Close,
      Volume: quote.Volume,
      TurnoverValue: quote.TurnoverValue,
      AdjustmentFactor: quote.AdjustmentFactor,
      AdjustmentOpen: quote.AdjustmentOpen,
      AdjustmentHigh: quote.AdjustmentHigh,
      AdjustmentLow: quote.AdjustmentLow,
      AdjustmentClose: quote.AdjustmentClose,
      AdjustmentVolume: quote.AdjustmentVolume,
      lastUpdated: new Date().toISOString(),
    }));

    const csv = stringify(data, { header: true });
    fs.writeFileSync(this.getFilePath(DAILY_QUOTES_FILE), csv);
  }

  loadDailyQuotes(): DailyQuote[] | null {
    const filePath = this.getFilePath(DAILY_QUOTES_FILE);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const records = parse(content, { columns: true });
    
    return records.map((record: any) => ({
      Code: record.Code,
      Date: record.Date,
      Open: record.Open ? parseFloat(record.Open) : 0,
      High: record.High ? parseFloat(record.High) : 0,
      Low: record.Low ? parseFloat(record.Low) : 0,
      Close: record.Close ? parseFloat(record.Close) : 0,
      Volume: record.Volume ? parseFloat(record.Volume) : 0,
      TurnoverValue: record.TurnoverValue ? parseFloat(record.TurnoverValue) : 0,
      AdjustmentFactor: record.AdjustmentFactor ? parseFloat(record.AdjustmentFactor) : 0,
      AdjustmentOpen: record.AdjustmentOpen ? parseFloat(record.AdjustmentOpen) : 0,
      AdjustmentHigh: record.AdjustmentHigh ? parseFloat(record.AdjustmentHigh) : 0,
      AdjustmentLow: record.AdjustmentLow ? parseFloat(record.AdjustmentLow) : 0,
      AdjustmentClose: record.AdjustmentClose ? parseFloat(record.AdjustmentClose) : 0,
      AdjustmentVolume: record.AdjustmentVolume ? parseFloat(record.AdjustmentVolume) : 0,
    }));
  }

  getCacheInfo(): { exists: boolean; files: string[]; age?: number } {
    const files: string[] = [];
    const filePaths = [COMPANY_INFO_FILE, FINANCIAL_STATEMENTS_FILE, DAILY_QUOTES_FILE];
    
    let oldestTime: number | null = null;
    
    for (const file of filePaths) {
      const filePath = this.getFilePath(file);
      if (fs.existsSync(filePath)) {
        files.push(file);
        const stats = fs.statSync(filePath);
        const fileTime = stats.mtime.getTime();
        if (oldestTime === null || fileTime < oldestTime) {
          oldestTime = fileTime;
        }
      }
    }
    
    const result: { exists: boolean; files: string[]; age?: number } = {
      exists: files.length > 0,
      files,
    };
    
    if (oldestTime !== null) {
      result.age = Date.now() - oldestTime;
    }
    
    return result;
  }

  clearCache(): void {
    const filePaths = [COMPANY_INFO_FILE, FINANCIAL_STATEMENTS_FILE, DAILY_QUOTES_FILE];
    
    for (const file of filePaths) {
      const filePath = this.getFilePath(file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }

  saveAllData(companies: CompanyInfo[], statements: FinancialStatement[], quotes: DailyQuote[]): void {
    this.saveCompanyInfo(companies);
    this.saveFinancialStatements(statements);
    this.saveDailyQuotes(quotes);
  }

  loadAllData(): { companies: CompanyInfo[] | null; statements: FinancialStatement[] | null; quotes: DailyQuote[] | null } {
    return {
      companies: this.loadCompanyInfo(),
      statements: this.loadFinancialStatements(),
      quotes: this.loadDailyQuotes(),
    };
  }
}