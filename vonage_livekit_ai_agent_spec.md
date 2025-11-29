# Vonage × LiveKit Agents × OpenAI Realtime  
音声通話AIエージェント構築仕様書 / 要件定義書

---

## 1. 目的

Vonageの電話番号からの着信をSIP経由でLiveKitに取り込み、  
LiveKit Agents + OpenAI Realtime API によってリアルタイム会話可能な  
音声AIエージェントを実装する。

最終ゴール：

```
📞 電話 → Vonage番号 → SIP Trunk → LiveKit Room
→ LiveKit Agent → AIが音声で応答 (STT + LLM + TTS)
```

---

## 2. 成果物（Deliverables）

| 成果物 | 内容 |
|---|---|
| LiveKit ローカル環境 | API Key / Secret発行含む |
| ngrok公開構成 | SIPトラフィックを外部から受入可能に |
| Vonage SIP Trunk設定 | ローカルLiveKitへ着信転送 |
| Node.js LiveKit Agentコード | OpenAI Realtime対応 |
| 電話でAIと会話できる完成システム | 受入試験で確認 |

---

## 3. 前提環境

| 項目 | 必須条件 |
|---|---|
| OS | macOS / Linux / WSL |
| Node.js | 18 以上 |
| LiveKit | 最新版 |
| Vonage | API Key / Secret / 電話番号あり |
| OpenAI | Realtime API Keyあり |
| 公開方法 | ngrok TCP利用 |

---

## 4. システム構成図

```
Vonage Voice API（PSTN）
        ↓
SIP Trunk
        ↓
ngrok tcp → localhost:5060
        ↓
LiveKit SIP Gateway
        ↓
LiveKit Room
        ↓
LiveKit Agent Worker
        ↓
OpenAI Realtime API (gpt-4o-realtime-preview)
```

---

## 5. 実装タスク

### ◎ Step1：LiveKitローカル構築

```bash
curl -sSL https://get.livekit.io/install.sh | bash
livekit-server --dev
```

- Dashboard: `http://localhost:7880`
- API Key / Secret発行

---

### ◎ Step2：SIP Gateway起動

```bash
livekit-server \
  --sip.amqp-server amqp://guest:guest@localhost:5672 \
  --sip.sip-relay-host 0.0.0.0:5060
```

- 5060/UDP(or TLS)で受付  
- 後でVonage SIP Trunk → ここへINVITE転送

---

### ◎ Step3：ngrokでSIPポート公開

```bash
ngrok tcp 5060
```

例出力：

```
tcp://0.tcp.ngrok.io:19342 → localhost:5060
```

使用するSIP URI形式：

```
sip:agent@0.tcp.ngrok.io:19342
```

---

### ◎ Step4：Vonage 管理画面設定

Dashboard → **Voice → SIP Trunk → Create**

| Key | Value |
|---|---|
| SIP URI | `sip:agent@<ngrok-host>:<port>` |
| From Number | 購入番号を紐付ける |
| Codec | G.711 |

📞 試験：  
スマホ → Vonage番号へ発信 → LiveKit Roomに参加すること

---

### ◎ Step5：LiveKit Agent 実装

```bash
mkdir livekit-agent
cd livekit-agent
npm init -y
npm install livekit-agents @livekit/agents-plugin-openai
```

#### `agent.js`

```js
import { Worker } from "livekit-agents";
import { OpenAIModel } from "@livekit/agents-plugin-openai";

const worker = new Worker({
  apiKey: process.env.LK_KEY,
  apiSecret: process.env.LK_SECRET,
  wsUrl: "ws://localhost:7880",
});

worker.addJob("voice-agent", async (ctx) => {
  console.log("☎️ Incoming call → Room:", ctx.room.name);

  const agent = await ctx.connectAgent({
    model: new OpenAIModel({
      model: "gpt-4o-realtime-preview",
      voice: "alloy",
    }),
    turnDetection: true,
  });

  agent.on("user_started_speaking", () => console.log("User talking..."));
  agent.on("agent_speaking", () => console.log("AI responding..."));
});
```

起動：

```bash
node agent.js
```

---

## 6. 受入テスト（Acceptance Test）

| テスト項目 | 合格条件 |
|---|---|
| Vonage番号に発信 | LiveKit RoomにSIP参加表示 |
| AIによる初回応答 | 着信後2秒以内に音声返答 |
| 双方向会話 | 5往復以上自然に進行 |
| STT→LLM→TTS戻り動作 | 遅延少なく成立 |

---

## 7. 拡張提案（将来）

- Outbound Dialer（発信BOT）
- CRM/kintone/FileMaker統合
- 音声録音→文字起こし→要約
- 着信100同時処理＋Auto-scale構成
- 督促・BPO特化プロンプト

---
