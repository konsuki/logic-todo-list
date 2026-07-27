#!/usr/bin/env python3
"""
Phase 2: AI によるトピック分類スクリプト。

inbox 内の全 Markdown ファイルの YAML フロントマターに
topic / tags を付与し、適切なファイル名 slug を生成する。

分類ロジック: キーワードベースのルール＋カテゴリ推論
"""

import os
import re
import json
import sys
from collections import Counter
from pathlib import Path

# --- 設定 ---
INBOX_DIR = "/Users/konnsuki/obsidian/日常で使える知識/google-ai-history/_inbox"
ENTRIES_JSON = "/Users/konnsuki/Desktop/Programs/logic-todo-list/tools/google-ai-history/entries.json"

# --- カテゴリ定義 ---
# (カテゴリ名, サブカテゴリ名, キーワードリスト, 除外キーワード)
CATEGORY_RULES = [
    # --- 技術・プログラミング ---
    ("技術・プログラミング", "API・通信", [
        "api", "rest api", "graphql", "grpc", "soap", "websocket", "webhook",
        "エンドポイント", "curl", "http", "fetch", "通信",
        "twitterapi", "gas", "google apps script", "openai api",
        "bedrock", "aws", "anthropic", "openrouter",
    ], []),
    ("技術・プログラミング", "AI・LLM", [
        "deepseek", "chatgpt", "gpt-", "claude code", "claude", "antigravity",
        "gemini", "llm", "aiエージェント", "ai agent", "機械学習",
        "モデル", "token", "プロンプト", "few-shot", "chain of thought",
        "grok", "fable", "haiku", "sonnet", "opus",
        "openai", "rag", "ベクトル", "強化学習", "dqn", "ngu",
        "agent57", "勾配降下法", "aiモード", "ai モード",
        "ollama", "cerebras", "tokenrouter", "glm-5", "clip",
        "ディープリサーチ", "aiスクール", "veo3",
        "音声認識", "transcription", "whisper",
        "動画生成ai", "画像生成", "gpt-image",
        "mcp", "aiに", "aiを", "aiで", "aiの", "aiが",
        "claude squad", "claude fable", "geminicli",
        "sel", "フレクション", "セルフリフレクション",
        "説明可能なai", "xai",
    ], []),
    ("技術・プログラミング", "コマンド・シェル", [
        "コマンド", "command", "ターミナル", "terminal",
        "brew", "npx", "pip", "npm", "yarn", "git",
        "ssh", "lsof", "launchctl", "grep", "sed", "awk",
        "ポート", "サーバー", "プロセス",
        "du -sh", "ls -la", "yt-dlp", "ffmpeg",
        "エラー", "error", "exit code", "traceback",
        "環境変数", "env", "path=", "conda", "pyenv",
        "docker", "scp", "rsync",
        "child_process", "spawn",
        "dtrace",
        "ショートカットキー", "キーボードショートカット",
    ], []),
    ("技術・プログラミング", "言語・フレームワーク", [
        "python", "javascript", "js ", "react", "nextjs", "typescript",
        "fastapi", "node", "npm", "vite", "webpack",
        "html", "css", "svg", "cdn",
        "プログラミング", "framework", "フレームワーク",
        "コード", "github", "リポジトリ", "コミット",
        "ディレクトリ構成", "フォルダ整理", "ディレクトリ整理",
        "wordpress", "microcms", "supabase",
        "playwright", "puppeteer", "selenium",
        "バイナリ", "バイナリエディタ",
        "remotion", "lottie", "アニメーションライブラリ",
        "コンポーネント", "責任分離",
        "spa", "ssg",
    ], []),

    # --- 語源・由来 ---
    ("語源・由来", "", [
        "語源", "由来", "起源", "語源は", "起源は",
        "なんていう", "呼び名", "と呼ばれる", "なぜ呼ばれる",
        "名前の由来", "どこの国", "別の国",
        "英語で", "日本語で", "韓国語で", "中国語で",
        "意味を教えて", "意味は", "とは ", "とは?",
        "どういう意味", "なんで", "なぜ", "どうして",
        "読み方", "発音", "なんて読む", "なんて言う",
        "定義して", "定義を", "厳密に定義",
        "使い方", "使われる", "使う",
    ], [
        # 除外: 明らかに他のカテゴリに属するもの
    ]),

    # --- 歴史・社会 ---
    ("歴史・社会", "", [
        "歴史", "江戸", "皇居", "城", "跡地",
        "1517", "ルター", "宗教改革", "九十五箇条",
        "戦い", "合戦", "関ケ原", "戦国", "秀吉", "織田", "徳川",
        "明治", "大正", "昭和", "平安", "鎌倉",
        "日本史", "世界史", "進化", "猿から人間",
        "満洲", "満洲国", "山本五十六", "渋沢",
        "慰安婦", "エプスタイン",
        "選挙", "解散", "国会", "総理大臣", "組織票",
        "売春", "買春", "罰則",
        "自由主義", "小さな政府",
        "文化", "伝統", "忍者", "流派",
    ], []),

    # --- 地理・文化・言語 ---
    ("地理・文化・言語", "", [
        "上野", "浅草", "台東区", "渋谷", "新宿", "幡ヶ谷",
        "ロンドン", "アイルランド", "イギリス", "スコットランド",
        "ドイツ", "中国", "韓国", "日本", "アジア", "ヨーロッパ",
        "オランダ", "イタリア", "フランス", "アメリカ",
        "枚方", "奥多摩", "代々木",
        "韓国語", "中国語", "英語", "日本語", "ラテン語",
        "助詞", "ハングル", "活用形", "50音",
        "言語", "翻訳", "英語にして", "日本語にして",
        "地理", "地形的", "山", "川", "海峡",
        "大学受験", "地理",
        "観光", "町", "どんな町",
        "電車", "バス", "駅", "営業所",
    ], []),

    # --- 科学・自然 ---
    ("科学・自然", "", [
        "科学", "物理", "化学", "生物学", "遺伝子", "dna",
        "白血球", "細菌", "ウイルス", "感染",
        "モノベンゾン", "メラノサイト", "メラニン",
        "皮膚", "ターンオーバー", "基底層",
        "コラーゲン", "エラスチン", "レチノール", "トレチノイン",
        "フェニルエチルアミン", "ドーパミン", "オキシトシン",
        "セロトニン", "ホルモン", "男性ホルモン",
        "精子", "卵子", "受精",
        "進化", "進化論", "突然変異", "アルビノ",
        "動物", "植物", "昆虫", "鳥", "魚", "牛", "馬", "ロバ",
        "アロワナ", "モルモット", "猫", "犬", "猿",
        "烏骨鶏", "エンスワ", "羽アリ",
        "宇宙", "惑星", "太陽系", "膨張", "光の速度", "相対性理論",
        "反物質", "次元", "超ひも理論", "弦理論",
        "カオス理論", "ジュリア集合",
        "虚数", "i ", "複素数", "オイラー",
        "波長", "音", "周波数", "倍音",
        "地球", "気候", "海洋性気候",
        "電子", "光子", "量子",
        "呼気", "アルコール", "酔い",
        "液体", "摩擦力", "ぬるぬる",
        "氷", "塩", "温度",
        "尋常性乾癬", "乾癬", "短脊椎症",
        "クロニジン", "コンサータ", "adhd",
        "耳抜き", "ダイビング",
        "波", "音波", "波長",
    ], []),

    # --- 数学・論理 ---
    ("数学・論理", "", [
        "数学", "証明", "定義", "定理", "公式",
        "数式", "方程式", "関数", "変数",
        "統計", "確率", "期待値", "分散", "不偏分散", "標準偏差",
        "シグマ", "σ", "μ", "ガウス", "分布",
        "積分", "微分", "恒等式", "べき乗",
        "写像", "偏角", "有向非巡回グラフ",
        "ナンプレ", "数独", "10958",
        "鶴亀算", "計算して",
        "論理", "論理学", "命題", "真偽", "p⇒q",
        "演繹", "アブダクション", "帰納",
        "因果", "因果関係", "決定論的",
        "規則前提", "大前提",
        "プロスペクト理論",
        "目的", "条件", "条件分岐",
        "集合", "写像",
        "バイアス", "生存者バイアス",
    ], []),

    # --- 法律・ビジネス ---
    ("法律・ビジネス", "", [
        "法律", "刑法", "民法", "詐欺", "立件", "逮捕",
        "クーリングオフ", "不実告知", "情報商材", "返金",
        "生活保護", "福祉事務所", "ケースワーカー", "受給",
        "都営住宅", "紹介状", "病院", "処方",
        "非上場", "株", "ビジネス", "経済", "物価", "給料",
        "lbo", "デイトレード", "バイナリーオプション",
        "不動産", "賃貸", "物件", "宅建業者", "家賃保証会社",
        "保証人", "緊急連絡先",
        "丸紅", "伊藤忠", "近江商人",
        "業種", "職種", "フリーダイヤル",
        "google eeat", "seo", "評価基準",
        "クレジットカード", "借金",
        "商売道", "商売",
        "free", "dompop", "textnow", "通信費",
        "クレーンゲーム", "確率機",
        "消費者", "業者", "取引",
    ], []),

    # --- 料理・生活 ---
    ("料理・生活", "", [
        "料理", "食材", "調味料", "レシピ", "食べ物",
        "ご飯", "おかず", "味噌", "醤油",
        "八宝菜", "白菜", "焦げ目", "焦げ",
        "わさび", "きのこ", "出汁", "鶏皮",
        "オリーブオイル", "味の素", "トマトペースト",
        "タコス", "ラクサ", "辛ラーメン",
        "業務スーパー", "刺身", "焼き魚", "冷凍",
        "コーヒー", "あったかい", "飲み物",
        "シーリングライト", "部品",
        "加湿器", "香水",
        "土鍋", "鍋",
        "乾燥肌", "食事", "サプリ",
        "熱いシャワー", "かゆみ", "掻く",
        "おむつ", "ティッシュ",
        "駄菓子屋",
        "ドラゴンフルーツ",
        "無印良品", "リラスト",
    ], []),

    # --- エンタメ・ポップカルチャー ---
    ("エンタメ・ポップカルチャー", "", [
        "youtube", "youtuber", "動画", "チャンネル", "サムネ",
        "tiktok", "twitter", "instagram", "x ",
        "アニメ", "漫画", "ドラマ", "映画",
        "ゲーム", "プレイ", "ベイブレード",
        "こち亀", "ドラゴンボール", "サザエさん", "ちびまる子ちゃん",
        "コナン", "名探偵", "クレヨンしんちゃん",
        "バック・トゥ・ザ・フューチャー", "マーティー",
        "ナルト", "チ。", "最遊記", "海賊無双",
        "櫻坂46", "乃木坂46", "エグザイル",
        "米津玄師", "kpop", "k-pop",
        "お笑い", "芸人", "ダウンタウン", "水曜日のダウンタウン",
        "くりぃむナンタラ", "電車男", "片桐はいり",
        "遠隔操作", "一般人", "インカム",
        "大喜利", "すべる", "笑い",
        "文春", "女性週刊誌", "週刊女性",
        "プロレス", "台本",
        "ポルシェ", "車",
        "メディ・アバリンバ", "リアリティショー",
        "ネトフリ", "netflix", "暴君のシェフ",
        "インターステラー",
        "音楽", "bgm", "バイオリン", "歌", "歌声",
        "ラップ", "白人英語",
        "サッカー", "日本代表",
        "オリンピック", "スロープスタイル",
        "マクドナルド", "バーガーキング",
        "マリオ", "ドンキーコング",
        "任天堂", "sega", "gigo",
        "アスキーアート", "フレーム",
        "アングラ", "卑猥", "食う",
        "竹内亮介", "市岡優衣", "前田沙夜香", "渡辺侑都",
        "唐渡", "榎本克誠",
        "エレガンス笹塚",
    ], []),

    # --- ファッション・衣類 ---
    ("ファッション・衣類", "", [
        "m-51", "パーカー", "ミリタリー",
        "赤い星", "帽子", "人民帽",
        "スカート", "キルト",
        "ファッション", "衣類", "服装", "髪型",
        "化粧", "オネエ", "美容",
        "イケおじ", "イケメン",
        "コスメ", "美容クリーム",
    ], []),

    # --- メディア・出版 ---
    ("メディア・出版", "", [
        "メディア", "出版", "新聞", "雑誌",
        "女性週刊誌", "週刊女性",
    ], []),
]

# 分類結果を格納
classification_map = {}  # filename -> (topic_list, tag_list)


def classify_query(query: str) -> tuple[list[str], list[str], str]:
    """クエリを分類し、(topic_list, tag_list, subdir) を返す。"""
    q = query.lower()

    topics = []
    tags = []
    best_subdir = ""

    for cat, subcat, keywords, excludes in CATEGORY_RULES:
        # 除外チェック
        skip = False
        for ex in excludes:
            if ex.lower() in q:
                skip = True
                break
        if skip:
            continue

        # キーワードマッチ
        score = 0
        matched_keywords = []
        for kw in keywords:
            if kw.lower() in q:
                score += 1
                matched_keywords.append(kw)

        if score >= 1:
            if cat not in topics:
                topics.append(cat)
            if subcat and subcat not in topics:
                # subcat は実質的にパスの一部だが、
                # topic フロントマターには cat だけ入れる
                pass
            if subcat:
                best_subdir = subcat
            # マッチしたキーワードをタグ候補に
            tags.extend(matched_keywords[:3])

    # 重複除去
    topics = list(dict.fromkeys(topics))
    tags = list(dict.fromkeys(tags))

    # どのカテゴリにもマッチしなかった場合
    if not topics:
        topics = ["その他"]

    # タグが多すぎる場合は先頭5個に絞る
    tags = tags[:5]

    return topics, tags, best_subdir


def update_markdown(filepath: str, topics: list[str], tags: list[str]):
    """Markdown ファイルの YAML フロントマターを更新する。"""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # topic フィールドを更新
    topic_str = ", ".join(topics)
    content = re.sub(
        r"topic:\s*\[.*?\]",
        f"topic: [{topic_str}]",
        content,
        count=1,
    )

    # tags フィールドを更新（既存のタグとマージ）
    existing_tags = re.search(r"tags:\s*\[(.*?)\]", content)
    if existing_tags:
        existing = [t.strip() for t in existing_tags.group(1).split(",") if t.strip()]
        all_tags = list(dict.fromkeys(tags + existing))  # 重複除去、順序保持
        tags_str = ", ".join(all_tags[:10])  # 最大10個
        content = re.sub(
            r"tags:\s*\[.*?\]",
            f"tags: [{tags_str}]",
            content,
            count=1,
        )

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)


def main():
    inbox = Path(INBOX_DIR)
    files = sorted(inbox.glob("*.md"))

    stats = Counter()
    classified = 0
    unclassified = 0

    for fp in files:
        content = fp.read_text(encoding="utf-8")
        m = re.search(r'query:\s*"(.+?)"', content)
        query = m.group(1) if m else ""

        topics, tags, subdir = classify_query(query)

        # 統計
        for t in topics:
            stats[t] += 1
        if topics == ["その他"]:
            unclassified += 1
        else:
            classified += 1

        # ファイル更新
        update_markdown(str(fp), topics, tags)
        classification_map[fp.name] = {
            "topics": topics,
            "tags": tags,
            "subdir": subdir,
        }

    # 結果出力
    print(f"📊 分類結果:")
    print(f"  分類済み: {classified} 件")
    print(f"  その他: {unclassified} 件")
    print()
    print("📁 カテゴリ別件数:")
    for cat, count in stats.most_common():
        print(f"  {cat}: {count} 件")

    # 分類マップを保存
    output_path = Path(
        "/Users/konnsuki/Desktop/Programs/logic-todo-list/tools/google-ai-history/classification.json"
    )
    output_path.write_text(
        json.dumps(classification_map, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"\n💾 分類マップを保存しました: {output_path}")

    # その他に分類されたサンプルを表示
    others = [fp.name for fp in files if classification_map.get(fp.name, {}).get("topics") == ["その他"]]
    print(f"\n⚠️ 「その他」に分類されたファイル: {len(others)} 件")
    if others:
        print("  サンプル:")
        for fname in others[:15]:
            # クエリを表示
            fp = inbox / fname
            if fp.exists():
                c = fp.read_text(encoding="utf-8")
                m = re.search(r'query:\s*"(.+?)"', c)
                if m:
                    print(f"    - {fname}: {m.group(1)[:80]}")


if __name__ == "__main__":
    main()
