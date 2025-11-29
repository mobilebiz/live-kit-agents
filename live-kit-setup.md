# LiveKit Cloud 設定手順書

このドキュメントは、LiveKit Cloudを使用して音声AIエージェントを構築するための設定手順をまとめたものです。

## 1. アカウント作成とログイン

1.  [LiveKit Cloud](https://cloud.livekit.io/) にアクセスします。
2.  GoogleアカウントまたはGitHubアカウントを使用してサインアップ/ログインします。

## 2. プロジェクト作成とAPIキー取得

1.  ダッシュボードで **"Create Project"** をクリックします（初回ログイン時は自動的に作成画面になる場合があります）。
2.  プロジェクト名を入力して作成します。
3.  プロジェクトダッシュボードの左サイドバーから **"Settings"** (歯車アイコン) > **"Keys"** に移動します。
4.  **"Add New Key"** をクリックしてAPIキーを作成します。
5.  表示された **API Key** と **API Secret** をコピーして安全な場所に保存します（`.env`ファイルなど）。
6.  同じくSettingsページにある **WebSocket URL** (例: `wss://your-project.livekit.cloud`) も控えておきます。

## 3. SIP (Telephony) 設定

Vonageなどの外部電話サービスからの着信をLiveKitで受け取るための設定です。

### 3.1 SIP URIの確認

1.  プロジェクトダッシュボードの左サイドバーから **"Telephony"** (電話アイコン) をクリックします。
2.  サブメニューから **"SIP trunks"** を選択します。
3.  画面上部に表示されている **SIP URI** を確認します。
    *   形式: `sip:<project-id>.sip.livekit.cloud`
    *   例: `sip:2mrrogw7fj6.sip.livekit.cloud`
### 3. SIP Inbound Trunkの設定
1. 左サイドバーの **Telephony** > **SIP trunks** をクリックします。
2. **Create new trunk** をクリックします。
3. 以下の情報を入力します：
    - **Name**: `Vonage Inbound` (任意の名前)
    - **Direction**: `Inbound`
    - **Allowed addresses**: `216.147.0.0/18, 168.100.64.0/1` (Vonage Singapore IP)
        - ※Vonageのリージョンに合わせてIPアドレスを設定してください。
    - **Media encryption**: **Enabled** (重要！VonageはSRTPを強制するため、ここを有効にする必要があります)
4. **Create** をクリックします。

### 4. Dispatch Ruleの設定
1. **Dispatch rules** タブをクリックします。
2. **Create new rule** をクリックします。
3. 以下の情報を入力します：
    - **Name**: `Vonage Rule`
    - **Rule Type**: `Individual`
    - **Trunk**: `Vonage Inbound` (作成したTrunkを選択)
    - **Dispatch to**: `Room`
    - **Room name**: `call-room` (Agentが参加するRoom名)
    - **Pin**: 空欄
4. **Create** をクリックします。

### 5. Vonage SIP Trunkの設定
1. Vonageダッシュボードの **Voice** > **SIP Trunking** に移動します。
2. **"Create a SIP trunk"** (または "Add new") をクリックします。
3. 以下の設定を入力します：
    *   **Trunk Name**: 任意の名前 (例: `LiveKit Agent`)
    *   **SIP URI**: LiveKit Cloudで確認したURI (例: `sip:2mrrogw7fj6.sip.livekit.cloud`)
    *   **Transport**: **TLS**
    *   **SRTP**: **Enabled** (LiveKit Cloud側もEnabledにする必要があります)
    *   **From Number**: 購入済みの電話番号を選択してリンクします。
4. 設定を保存します。

これで、Vonageの電話番号にかかってきた電話が、LiveKit Cloudの指定したRoom (`call-room`) に転送されるようになります。


### 4.1 IPホワイトリスト設定 (必要な場合)

Vonage側でIPアドレスによる制限を行う場合は、以下のLiveKit CloudのIP帯域を許可してください：

*   `143.223.88.0/21`
*   `161.115.160.0/19`

---
*最終更新: 2025-11-29*
