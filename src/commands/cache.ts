import { Command } from 'commander';
import { JQuantsClient } from '../lib/jquants-client';

export const cacheCommand = new Command('cache')
  .description('キャッシュの管理')
  .option('--info', 'キャッシュの情報を表示')
  .option('--clear', 'キャッシュをクリア')
  .action(async (options) => {
    try {
      const client = new JQuantsClient();

      if (options.clear) {
        console.log('キャッシュをクリア中...');
        client.clearCache();
        console.log('キャッシュをクリアしました。');
        return;
      }

      // キャッシュ情報を表示
      const cacheInfo = client.getCacheInfo();
      
      console.log('\n【キャッシュ情報】');
      console.log('━'.repeat(50));
      
      if (cacheInfo.exists) {
        console.log(`キャッシュファイル: ${cacheInfo.files.length}個`);
        cacheInfo.files.forEach(file => console.log(`  - ${file}`));
        
        if (cacheInfo.age !== undefined) {
          const ageInMinutes = Math.floor(cacheInfo.age / 1000 / 60);
          const ageInHours = Math.floor(ageInMinutes / 60);
          const ageInDays = Math.floor(ageInHours / 24);
          
          if (ageInDays > 0) {
            console.log(`作成日時: ${ageInDays}日前`);
          } else if (ageInHours > 0) {
            console.log(`作成日時: ${ageInHours}時間前`);
          } else {
            console.log(`作成日時: ${ageInMinutes}分前`);
          }
        }
        
        console.log('\n使用方法:');
        console.log('  stock-checker screen           # キャッシュを使用');
        console.log('  stock-checker screen --no-cache # APIから最新データを取得');
        console.log('  stock-checker cache --clear     # キャッシュをクリア');
      } else {
        console.log('キャッシュファイルは見つかりませんでした。');
        console.log('\n最初にスクリーニングを実行すると、キャッシュが作成されます。');
        console.log('  stock-checker screen');
      }
      
    } catch (error) {
      console.error('エラーが発生しました:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });