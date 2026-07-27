#!/usr/bin/env python3
"""
Phase 3: 分類結果に基づいてファイルを _inbox/ から各カテゴリディレクトリに移動する。
"""

import json
import os
import re
import shutil
from pathlib import Path

INBOX_DIR = "/Users/konnsuki/obsidian/日常で使える知識/google-ai-history/_inbox"
BASE_DIR = "/Users/konnsuki/obsidian/日常で使える知識/google-ai-history"
CLASSIFICATION_FILE = "/Users/konnsuki/Desktop/Programs/logic-todo-list/tools/google-ai-history/classification.json"

# トピックからディレクトリへのマッピング
TOPIC_TO_DIR = {
    "技術・プログラミング": "技術・プログラミング",
    "語源・由来": "語源・由来",
    "歴史・社会": "歴史・社会",
    "地理・文化・言語": "地理・文化・言語",
    "科学・自然": "科学・自然",
    "数学・論理": "数学・論理",
    "法律・ビジネス": "法律・ビジネス",
    "料理・生活": "料理・生活",
    "エンタメ・ポップカルチャー": "エンタメ・ポップカルチャー",
    "ファッション・衣類": "ファッション・衣類",
    "メディア・出版": "メディア・出版",
    "その他": "その他",
}

# サブカテゴリのマッピング（存在する場合のみ）
SUBCAT_TO_DIR = {
    "API・通信": "技術・プログラミング/API・通信",
    "AI・LLM": "技術・プログラミング/AI・LLM",
    "コマンド・シェル": "技術・プログラミング/コマンド・シェル",
    "言語・フレームワーク": "技術・プログラミング/言語・フレームワーク",
}


def main():
    with open(CLASSIFICATION_FILE, "r", encoding="utf-8") as f:
        class_map = json.load(f)

    stats = {}
    moved = 0
    skipped = 0

    for filename, info in class_map.items():
        src = Path(INBOX_DIR) / filename
        if not src.exists():
            print(f"  ⚠️ ファイルが見つかりません: {filename}")
            skipped += 1
            continue

        topics = info.get("topics", ["その他"])
        subdir = info.get("subdir", "")

        # 移動先を決定
        primary_topic = topics[0] if topics else "その他"

        if subdir and subdir in SUBCAT_TO_DIR:
            dest_dir = Path(BASE_DIR) / SUBCAT_TO_DIR[subdir]
        elif primary_topic in TOPIC_TO_DIR:
            dest_dir = Path(BASE_DIR) / TOPIC_TO_DIR[primary_topic]
        else:
            dest_dir = Path(BASE_DIR) / "その他"

        dest_dir.mkdir(parents=True, exist_ok=True)
        dst = dest_dir / filename

        # 既に移動済みかチェック
        if dst.exists():
            # スキップ（既に移動されている）
            skipped += 1
            continue

        shutil.move(str(src), str(dst))
        moved += 1
        stats[str(dest_dir.relative_to(BASE_DIR))] = (
            stats.get(str(dest_dir.relative_to(BASE_DIR)), 0) + 1
        )

    print(f"📦 ファイル移動結果:")
    print(f"  移動: {moved} 件")
    print(f"  スキップ: {skipped} 件")
    print()
    print("📁 移動先別件数:")
    for d, count in sorted(stats.items(), key=lambda x: -x[1]):
        print(f"  {d}: {count} 件")

    # Inbox に残っているファイルを確認
    remaining = list(Path(INBOX_DIR).glob("*.md"))
    print(f"\n📥 _inbox/ に残っているファイル: {len(remaining)} 件")
    if remaining:
        print("  (これらは正常に移動されなかったものです)")


if __name__ == "__main__":
    main()
