import { Command } from 'commander';
import { JQuantsClient } from '../lib/jquants-client';
import { calculateIndicators, screenStocks } from '../lib/indicators';
import { FinancialIndicators } from '../types/indicators';

export const screenCommand = new Command('screen')
  .description('割安優良株をスクリーニングします')
  .option('--min-roe <value>', 'ROE（自己資本利益率）の最小値 (%)')
  .option('--min-operating-margin <value>', '営業利益率の最小値 (%)')
  .option('--min-equity-ratio <value>', '自己資本比率の最小値 (%)')
  .option('--min-sales-growth <value>', '売上高成長率の最小値 (%)')
  .option('--max-per <value>', 'PER（株価収益率）の最大値')
  .option('--max-pbr <value>', 'PBR（株価純資産倍率）の最大値')
  .option('--min-dividend-yield <value>', '配当利回りの最小値 (%)')
  .option('--min-market-cap <value>', '時価総額の最小値（百万円）')
  .option('--max-market-cap <value>', '時価総額の最大値（百万円）')
  .option('-l, --limit <number>', '表示する銘柄数', '20')
  .option('-s, --sector <sector>', '業種コード（33業種）でフィルタ')
  .option('-m, --market <market>', '市場コードでフィルタ')
  .option('--export <format>', 'エクスポート形式 (csv, json)')
  .option('--no-cache', 'キャッシュを使用せず、APIから最新データを取得')
  .option('--clear-cache', 'キャッシュをクリアしてから実行')
  .action(async (options) => {
    try {
      const email = process.env.JQUANTS_EMAIL;
      const password = process.env.JQUANTS_PASSWORD;

      if (!email || !password) {
        console.error('環境変数 JQUANTS_EMAIL と JQUANTS_PASSWORD を設定してください');
        process.exit(1);
      }

      const client = new JQuantsClient();
      
      // キャッシュクリアオプション
      if (options.clearCache) {
        console.log('キャッシュをクリア中...');
        client.clearCache();
      }
      
      // キャッシュ情報を表示
      const cacheInfo = client.getCacheInfo();
      if (cacheInfo.exists && options.cache) {
        const ageInMinutes = cacheInfo.age ? Math.floor(cacheInfo.age / 1000 / 60) : 0;
        console.log(`キャッシュが見つかりました (${ageInMinutes}分前に作成)`);
      }
      
      console.log('J-Quants APIに認証中...');
      await client.authenticate(email, password);

      console.log('企業一覧を取得中...');
      const companiesResponse = await client.getCachedCompanyList(options.cache);
      let companies = companiesResponse.info;

      // フィルタリング
      if (options.sector) {
        companies = companies.filter(c => c.Sector33Code === options.sector);
      }
      if (options.market) {
        companies = companies.filter(c => c.MarketCode === options.market);
      }

      console.log(`対象企業数: ${companies.length}社`);
      console.log('財務データと株価データを取得中...');

      // キャッシュを使用して一括取得
      const companyCodes = companies.map(c => c.Code);
      const [allStatements, allQuotes] = await Promise.all([
        client.getCachedStatements(companyCodes, options.cache),
        client.getCachedDailyQuotes(companyCodes, undefined, undefined, options.cache)
      ]);

      // 企業コードごとにデータをグループ化
      const statementsByCode = new Map<string, typeof allStatements[0][]>();
      const quotesByCode = new Map<string, typeof allQuotes[0][]>();
      
      allStatements.forEach(stmt => {
        if (!statementsByCode.has(stmt.LocalCode)) {
          statementsByCode.set(stmt.LocalCode, []);
        }
        statementsByCode.get(stmt.LocalCode)!.push(stmt);
      });
      
      allQuotes.forEach(quote => {
        if (!quotesByCode.has(quote.Code)) {
          quotesByCode.set(quote.Code, []);
        }
        quotesByCode.get(quote.Code)!.push(quote);
      });

      // 指標を計算
      const indicators: FinancialIndicators[] = [];
      for (const company of companies) {
        const statements = statementsByCode.get(company.Code) || [];
        const quotes = quotesByCode.get(company.Code) || [];
        
        if (statements.length > 0 && quotes.length > 0) {
          const indicator = calculateIndicators(
            company,
            statements,
            quotes
          );
          if (indicator) {
            indicators.push(indicator);
          }
        }
      }
      
      console.log(`計算完了: ${indicators.length}社のデータを処理`);

      console.log('\nスクリーニング実行中...');
      
      // スクリーニング条件
      const criteria = {
        minRoe: options.minRoe ? parseFloat(options.minRoe) : undefined,
        minOperatingProfitMargin: options.minOperatingMargin ? parseFloat(options.minOperatingMargin) : undefined,
        minEquityRatio: options.minEquityRatio ? parseFloat(options.minEquityRatio) : undefined,
        minSalesGrowthRate: options.minSalesGrowth ? parseFloat(options.minSalesGrowth) : undefined,
        maxPer: options.maxPer ? parseFloat(options.maxPer) : undefined,
        maxPbr: options.maxPbr ? parseFloat(options.maxPbr) : undefined,
        minDividendYield: options.minDividendYield ? parseFloat(options.minDividendYield) : undefined,
        minMarketCap: options.minMarketCap ? parseFloat(options.minMarketCap) : undefined,
        maxMarketCap: options.maxMarketCap ? parseFloat(options.maxMarketCap) : undefined,
      };

      const screened = screenStocks(indicators, criteria);
      
      // ROEの高い順でソート
      screened.sort((a, b) => (b.roe || 0) - (a.roe || 0));
      
      const limit = parseInt(options.limit);
      const results = screened.slice(0, limit);

      console.log(`\n条件に合致した銘柄数: ${screened.length}社`);
      
      if (options.export === 'json') {
        console.log(JSON.stringify(results, null, 2));
      } else if (options.export === 'csv') {
        console.log('Code,企業名,業種,市場,ROE(%),営業利益率(%),自己資本比率(%),PER,PBR,株価,時価総額(百万円)');
        results.forEach(r => {
          const roe = r.roe !== undefined && r.roe !== null && r.roe !== 0 ? r.roe.toFixed(2) : 'N/A';
          const operatingMargin = r.operatingProfitMargin !== undefined && r.operatingProfitMargin !== null && r.operatingProfitMargin !== 0 ? r.operatingProfitMargin.toFixed(2) : 'N/A';
          const equityRatio = r.equityRatio !== undefined && r.equityRatio !== null && r.equityRatio !== 0 ? r.equityRatio.toFixed(2) : 'N/A';
          const per = r.per !== undefined && r.per !== null && r.per !== 0 ? r.per.toFixed(2) : 'N/A';
          const pbr = r.pbr !== undefined && r.pbr !== null && r.pbr !== 0 ? r.pbr.toFixed(2) : 'N/A';
          const price = r.currentPrice !== undefined && r.currentPrice !== null && r.currentPrice !== 0 ? r.currentPrice : 'N/A';
          const marketCap = r.marketCap !== undefined && r.marketCap !== null && r.marketCap !== 0 ? r.marketCap.toFixed(0) : 'N/A';
          
          console.log(`${r.code},"${r.companyName}","${r.sector}","${r.market}",${roe},${operatingMargin},${equityRatio},${per},${pbr},${price},${marketCap}`);
        });
      } else {
        console.log('\n【割安優良株スクリーニング結果】');
        console.log('━'.repeat(120));
        console.log('Code\t企業名\t\t\t業種\t\tROE\t営業利益率\t自己資本比率\tPER\tPBR\t株価\t時価総額');
        console.log('━'.repeat(120));
        
        results.forEach((stock) => {
          const name = stock.companyName.length > 12 
            ? stock.companyName.substring(0, 12) + '...' 
            : stock.companyName.padEnd(15, ' ');
          const sector = stock.sector.length > 8
            ? stock.sector.substring(0, 8) + '...'
            : stock.sector.padEnd(10, ' ');
          
          const roe = stock.roe !== undefined && stock.roe !== null && stock.roe !== 0 ? `${stock.roe.toFixed(1)}%` : 'N/A';
          const operatingMargin = stock.operatingProfitMargin !== undefined && stock.operatingProfitMargin !== null && stock.operatingProfitMargin !== 0 ? `${stock.operatingProfitMargin.toFixed(1)}%` : 'N/A';
          const equityRatio = stock.equityRatio !== undefined && stock.equityRatio !== null && stock.equityRatio !== 0 ? `${stock.equityRatio.toFixed(1)}%` : 'N/A';
          const per = stock.per !== undefined && stock.per !== null && stock.per !== 0 ? stock.per.toFixed(1) : 'N/A';
          const pbr = stock.pbr !== undefined && stock.pbr !== null && stock.pbr !== 0 ? stock.pbr.toFixed(1) : 'N/A';
          const price = stock.currentPrice !== undefined && stock.currentPrice !== null && stock.currentPrice !== 0 ? `¥${stock.currentPrice.toLocaleString()}` : 'N/A';
          const marketCap = stock.marketCap !== undefined && stock.marketCap !== null && stock.marketCap !== 0 ? `${stock.marketCap.toFixed(0)}百万円` : 'N/A';
          
          console.log(
            `${stock.code}\t${name}\t${sector}\t` +
            `${roe}\t${operatingMargin}\t\t` +
            `${equityRatio}\t\t${per}\t${pbr}\t` +
            `${price}\t${marketCap}`
          );
        });
        
        console.log('\n【スクリーニング条件】');
        if (criteria.minRoe) console.log(`- ROE > ${criteria.minRoe}%`);
        if (criteria.minOperatingProfitMargin) console.log(`- 営業利益率 > ${criteria.minOperatingProfitMargin}%`);
        if (criteria.minEquityRatio) console.log(`- 自己資本比率 > ${criteria.minEquityRatio}%`);
        if (criteria.minSalesGrowthRate) console.log(`- 売上高成長率 > ${criteria.minSalesGrowthRate}%`);
        if (criteria.maxPer) console.log(`- PER < ${criteria.maxPer}倍`);
        if (criteria.maxPbr) console.log(`- PBR < ${criteria.maxPbr}倍`);
        if (criteria.minDividendYield) console.log(`- 配当利回り > ${criteria.minDividendYield}%`);
        if (criteria.minMarketCap) console.log(`- 時価総額 > ${criteria.minMarketCap}百万円`);
        if (criteria.maxMarketCap) console.log(`- 時価総額 < ${criteria.maxMarketCap}百万円`);
      }
    } catch (error) {
      console.error('エラーが発生しました:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });