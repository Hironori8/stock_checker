# J-Quants CLI Tool

J-Quants APIを使用して株式情報を取得するCLIツールです。

## セットアップ

1. 依存関係をインストール
```bash
npm install
```

2. 環境変数を設定
```bash
cp .env.example .env
```

`.env`ファイルを編集してJ-QuantsのメールアドレスとパスワードをYOUR_EMAILとYOUR_PASSWORD設定します。

3. ビルド
```bash
npm run build
```

## 使い方

### 企業一覧を取得
```bash
# 基本的な使い方
npm start companies

# または開発モードで実行
npm run dev companies

# JSON形式で出力
npm start companies -f json

# CSV形式で出力
npm start companies -f csv

# 業種でフィルタ（例：情報・通信業）
npm start companies -s 5250

# 市場でフィルタ（例：プライム市場）
npm start companies -m 0111

# 企業名で検索
npm start companies-n トヨタ
```

### 割安優良株スクリーニング
```bash
# 基本的な使い方（デフォルト条件でスクリーニング）
npm start screen

# カスタム条件でスクリーニング
npm start screen --min-roe 15 --max-per 10

# 業種を絞ってスクリーニング
npm start screen -s 5250  # 情報・通信業

# CSV形式でエクスポート
npm start screen --export csv > results.csv

# JSON形式でエクスポート
npm start screen --export json > results.json
```

## コマンドオプション

### `companies`コマンド
- `-f, --format <format>`: 出力形式を指定 (json, csv, table)
- `-s, --sector <sector>`: 業種コード（33業種）でフィルタ
- `-m, --market <market>`: 市場コードでフィルタ
- `-n, --name <name>`: 企業名で部分一致検索

### `screen`コマンド
- `--min-roe <value>`: ROE（自己資本利益率）の最小値 (デフォルト: 10%)
- `--min-operating-margin <value>`: 営業利益率の最小値 (デフォルト: 5%)
- `--min-equity-ratio <value>`: 自己資本比率の最小値 (デフォルト: 30%)
- `--max-per <value>`: PER（株価収益率）の最大値 (デフォルト: 15倍)
- `--max-pbr <value>`: PBR（株価純資産倍率）の最大値 (デフォルト: 1.5倍)
- `-l, --limit <number>`: 表示する銘柄数 (デフォルト: 20)
- `-s, --sector <sector>`: 業種コード（33業種）でフィルタ
- `-m, --market <market>`: 市場コードでフィルタ
- `--export <format>`: エクスポート形式 (csv, json)

## スクリーニング条件の説明

### 実績の良さを判断する指標
- **ROE (自己資本利益率)**: 株主資本に対する収益性。10%以上が優良
- **営業利益率**: 本業での収益性。5%以上が健全
- **自己資本比率**: 財務の安定性。30%以上が安定的

### 評価の低さを判断する指標
- **PER (株価収益率)**: 利益に対する株価の割安さ。15倍以下が割安
- **PBR (株価純資産倍率)**: 純資産に対する株価の割安さ。1.5倍以下が割安