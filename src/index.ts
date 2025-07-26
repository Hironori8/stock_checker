#!/usr/bin/env node

import { Command } from 'commander';
import dotenv from 'dotenv';
import { companiesCommand } from './commands/companies';
import { screenCommand } from './commands/screen';
import { cacheCommand } from './commands/cache';

// .envファイルを読み込む
dotenv.config();

const program = new Command();

program
  .name('jquants')
  .description('J-Quants APIを使用した株式情報取得ツール')
  .version('1.0.0');

// サブコマンドを追加
program.addCommand(companiesCommand);
program.addCommand(screenCommand);
program.addCommand(cacheCommand);

// コマンドライン引数をパース
program.parse(process.argv);