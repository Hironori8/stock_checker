import { Command } from 'commander';
import { JQuantsClient } from '../lib/jquants-client';
import { CompanyInfo } from '../types/jquants';

export const companiesCommand = new Command('companies')
  .description('J-Quants APIから企業一覧を取得します')
  .option('-f, --format <format>', '出力形式 (json, csv, table)', 'table')
  .option('-s, --sector <sector>', '業種コード（33業種）でフィルタ')
  .option('-m, --market <market>', '市場コードでフィルタ')
  .option('-n, --name <name>', '企業名で部分一致検索')
  .action(async (options) => {
    try {
      const email = process.env.JQUANTS_EMAIL;
      const password = process.env.JQUANTS_PASSWORD;

      if (!email || !password) {
        console.error('環境変数 JQUANTS_EMAIL と JQUANTS_PASSWORD を設定してください');
        process.exit(1);
      }

      console.log('J-Quants APIに認証中...');
      const client = new JQuantsClient();
      await client.authenticate(email, password);

      console.log('企業一覧を取得中...');
      const response = await client.getCompanyList();
      
      let companies = response.info;

      // フィルタリング
      if (options.sector) {
        companies = companies.filter(c => c.Sector33Code === options.sector);
      }
      if (options.market) {
        companies = companies.filter(c => c.MarketCode === options.market);
      }
      if (options.name) {
        const searchTerm = options.name.toLowerCase();
        companies = companies.filter(c => 
          c.CompanyName.toLowerCase().includes(searchTerm) ||
          c.CompanyNameEnglish.toLowerCase().includes(searchTerm)
        );
      }

      // 出力
      switch (options.format) {
        case 'json':
          console.log(JSON.stringify(companies, null, 2));
          break;
        case 'csv':
          console.log('Code,CompanyName,CompanyNameEnglish,Sector33Code,Sector33CodeName,MarketCode,MarketCodeName');
          companies.forEach(c => {
            console.log(`${c.Code},"${c.CompanyName}","${c.CompanyNameEnglish}",${c.Sector33Code},"${c.Sector33CodeName}",${c.MarketCode},"${c.MarketCodeName}"`);
          });
          break;
        case 'table':
        default:
          console.log(`\n取得した企業数: ${companies.length}\n`);
          console.log('Code\t企業名\t\t\t業種\t\t市場');
          console.log('━'.repeat(80));
          companies.slice(0, 50).forEach((company: CompanyInfo) => {
            const name = company.CompanyName.length > 15 
              ? company.CompanyName.substring(0, 15) + '...' 
              : company.CompanyName.padEnd(18, ' ');
            const sector = company.Sector33CodeName.length > 10
              ? company.Sector33CodeName.substring(0, 10) + '...'
              : company.Sector33CodeName.padEnd(13, ' ');
            console.log(`${company.Code}\t${name}\t${sector}\t${company.MarketCodeName}`);
          });
          if (companies.length > 50) {
            console.log(`\n... 他 ${companies.length - 50} 社`);
          }
          break;
      }
    } catch (error) {
      console.error('エラーが発生しました:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });