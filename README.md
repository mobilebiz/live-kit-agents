# Vonage LiveKit AI Agent

Vonage SIP Trunking、LiveKit Cloud、OpenAI Realtime API を組み合わせた、リアルタイム音声AIエージェントのサンプルプロジェクトです。
電話をかけると、AIエージェントが応答し、OpenAIのGPT-4o Realtimeモデルを使用して自然な会話を行います。

## 📋 前提条件

*   **Node.js**: v20以上
*   **Vonage アカウント**: SIP Trunking機能と電話番号が必要です。
*   **LiveKit Cloud アカウント**: 音声ストリーミング基盤として使用します。
*   **OpenAI API Key**: `gpt-4o-realtime-preview` モデルへのアクセス権限が必要です。

## 🚀 セットアップ手順

### 1. リポジトリのクローンとインストール

```bash
git clone https://github.com/mobilebiz/live-kit-agents.git
cd live-kit-agents
npm install
```

### 2. 環境変数の設定

`.env.example` (もしなければ新規作成) をコピーして `.env` を作成し、以下の変数を設定してください。

```bash
cp .env.example .env
```

**`.env` の内容:**

```env
LIVEKIT_URL=wss://<your-project>.livekit.cloud
LIVEKIT_API_KEY=<your-api-key>
LIVEKIT_API_SECRET=<your-api-secret>
OPENAI_API_KEY=<your-openai-api-key>
```

*   **LIVEKIT_URL, API_KEY, SECRET**: LiveKit Cloudのダッシュボード (Settings > Keys) から取得します。
*   **OPENAI_API_KEY**: OpenAIのプラットフォームから取得します。

### 3. LiveKit Cloud と Vonage の設定

詳細な設定手順は [live-kit-setup.md](./live-kit-setup.md) に記載されていますが、重要なポイントは以下の通りです。

#### LiveKit Cloud (Inbound Trunk)
*   **Allowed addresses**: `216.147.0.0/18, 168.100.64.0/1` (Vonage Singapore IP) ※リージョンに合わせて変更してください。
*   **Media encryption**: **Enabled** (必須)

#### LiveKit Cloud (Dispatch Rule)
*   **Trunk**: 作成したInbound Trunkを選択
*   **Dispatch to**: Room
*   **Room name**: `call-room`

#### Vonage (SIP Trunk)
*   **SIP URI**: `sip:<project-id>.sip.livekit.cloud`
*   **Transport**: **TLS** (必須)
*   **SRTP**: **Enabled** (必須)

> [!IMPORTANT]
> VonageはSRTP (音声暗号化) を強制するため、LiveKit CloudとVonageの両方で **SRTP/Media Encryption** を有効にし、SIP接続には **TLS** を使用する必要があります。これらが設定されていない場合、通話は即座に切断されます。

## ▶️ 実行方法

開発モードでエージェントを起動します：

```bash
npm run dev
```

起動後、Vonageで購入した電話番号に電話をかけると、エージェントが応答します。

## 🛠️ トラブルシューティング

*   **電話がすぐ切れる**:
    *   VonageとLiveKit Cloudの両方で **SRTP (Media Encryption)** が有効になっているか確認してください。
    *   VonageのSIP URI設定で **Transport: TLS** が選択されているか確認してください。
    *   LiveKit CloudのInbound Trunk設定で、VonageのIPアドレスが **Allowed addresses** に含まれているか確認してください。
*   **エージェントが応答しない**:
    *   `node agent.js dev` が実行中であることを確認してください。
    *   `.env` ファイルのAPIキーが正しいか確認してください。

## 📂 ファイル構成

*   `agent.js`: AIエージェントのメインロジック。LiveKit Agentsフレームワークを使用しています。
*   `live-kit-setup.md`: LiveKit CloudとVonageの詳細な設定手順書。
*   `package.json`: プロジェクトの依存関係定義。
