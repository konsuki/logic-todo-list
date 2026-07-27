#!/usr/bin/env python3
"""
Google AI Mode の My Activity HTML を Markdown ファイルに変換するスクリプト。

入力:
  /Users/konnsuki/Googleマイアクティビティ/AI モード/マイアクティビティ.html

出力:
  {output_dir}/ に {YYYY-MM-DD}_{slug}.md 形式で全エントリを出力する。
  topic / tags フロントマターは空欄で出力（Phase 2 で AI 分類後に付与）。

使用法:
  python3 convert_google_ai_history.py [--output-dir DIR] [--dry-run]
"""

import html as html_module
import os
import re
import sys
import argparse
from datetime import datetime, timezone, timedelta

# --- 設定 ---
INPUT_FILE = "/Users/konnsuki/Googleマイアクティビティ/AI モード/マイアクティビティ.html"
DEFAULT_OUTPUT_DIR = "/Users/konnsuki/obsidian/日常で使える知識/google-ai-history/_inbox"
JST = timezone(timedelta(hours=9))


def extract_entries(filepath: str) -> list[dict]:
    """HTML から全エントリを抽出する。"""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # 各エントリは mdl-typography--title ("AI モード") +
    # content-cell ... body-1 (本文) のペア
    pattern = (
        r'class="mdl-typography--title">(.*?)</div>'
        r'.*?'
        r'content-cell mdl-cell mdl-cell--6-col mdl-typography--body-1">(.*?)</div>'
    )
    matches = re.findall(pattern, content, re.DOTALL)

    entries = []
    for title_div, body_div in matches:
        # HTML タグ除去 + デコード
        body_text = re.sub(r"<[^>]*>", "", body_div)
        body_text = html_module.unescape(body_text)
        # \xa0 → 通常スペース
        body_text = body_text.replace("\xa0", " ")

        entry = parse_entry_body(body_text)
        if entry:
            entries.append(entry)

    return entries


def parse_entry_body(body_text: str) -> dict | None:
    """エントリ本文から日時・プロンプト・回答を抽出する。"""
    # 日時抽出: 「XXXX年XX月XX日...」を検索しましたYYYY/MM/DD HH:MM:SS JST
    date_match = re.search(
        r"(\d{4}/\d{2}/\d{2})\s+(\d{2}:\d{2}:\d{2})\s+JST", body_text
    )
    if not date_match:
        # 別パターン: 本文の先頭付近から日付を探す
        date_match = re.search(r"(\d{4})/(\d{2})/(\d{2})", body_text)
        if date_match:
            date_str = f"{date_match.group(1)}/{date_match.group(2)}/{date_match.group(3)} 00:00:00"
        else:
            return None
    else:
        date_str = f"{date_match.group(1)} {date_match.group(2)}"

    # クエリ抽出: 「『...』を検索しました」の形式
    query_match = re.search(r"「(.+?)」を検索しました", body_text)
    if not query_match:
        query_match = re.search(r"『(.+?)』を検索しました", body_text)
    if not query_match:
        # フォールバック: プロンプト: 以降を探す
        query_match = re.search(r"プロンプト:\s*\n(.+)", body_text)
        query = query_match.group(1).strip() if query_match else body_text[:100]
    else:
        query = query_match.group(1).strip()

    # プロンプト抽出
    prompt_match = re.search(r"プロンプト:\s*\n(.+?)(?:\n検索の回答:|\Z)", body_text, re.DOTALL)
    prompt = prompt_match.group(1).strip() if prompt_match else query

    # 回答抽出
    answer_match = re.search(
        r"検索の回答:\s*\n(.+?)(?:\n<FollowUp>|\n\Z|$)", body_text, re.DOTALL
    )
    answer = answer_match.group(1).strip() if answer_match else ""

    # FollowUp 抽出
    followup_match = re.search(r"<FollowUp>\s*\n(.+?)(?:\n</FollowUp>|\Z)", body_text, re.DOTALL)
    followup = followup_match.group(1).strip() if followup_match else ""

    # ISO 8601 日付生成
    try:
        dt = datetime.strptime(date_str, "%Y/%m/%d %H:%M:%S")
        dt = dt.replace(tzinfo=JST)
        iso_date = dt.isoformat()
        display_date = dt.strftime("%Y/%m/%d %H:%M JST")
        file_date = dt.strftime("%Y-%m-%d")
    except ValueError:
        try:
            dt = datetime.strptime(date_str, "%Y/%m/%d %H:%M:%S")
            dt = dt.replace(tzinfo=JST)
            iso_date = dt.isoformat()
            display_date = dt.strftime("%Y/%m/%d %H:%M JST")
            file_date = dt.strftime("%Y-%m-%d")
        except ValueError:
            iso_date = date_str
            display_date = date_str
            file_date = date_str.replace("/", "-").split(" ")[0]

    return {
        "date": iso_date,
        "display_date": display_date,
        "file_date": file_date,
        "query": query,
        "prompt": prompt,
        "answer": answer,
        "followup": followup,
    }


def generate_slug(query: str, max_words: int = 6) -> str:
    """検索クエリからファイル名用の英字スラグを生成する。

    簡易的なローマ字変換＋英単語抽出を行う。
    英字・数字以外は除去し、単語をハイフンで連結する。
    """
    # 英数字とスペースのみを残す（簡易）
    # 日本語交じりの場合は英字部分とローマ字部分を拾う
    cleaned = re.sub(r"[^\w\s]", " ", query)
    # 連続スペースを1つに
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    # 単語に分割し、最大 max_words 個を取得
    words = cleaned.split()[:max_words]
    slug = "-".join(w.lower() for w in words if w)

    # まったく英字がない場合（純日本語クエリ）は "query" にする
    if not slug:
        slug = "query"

    # 長すぎる場合は切り詰め
    if len(slug) > 80:
        slug = slug[:80]

    return slug


def build_markdown(entry: dict, slug: str, index: int) -> str:
    """エントリから Markdown コンテンツを生成する。"""
    title = entry["query"][:100].replace("\n", " ")

    # FollowUp ブロックがあれば引用として追記
    followup_section = ""
    if entry["followup"]:
        followup_lines = entry["followup"].split("\n")
        followup_quoted = "\n".join(f"> {line}" for line in followup_lines)
        followup_section = f"\n## AI からの追加質問\n{followup_quoted}\n"

    # YAML フロントマターで使えるようにクエリ内の特殊文字を処理
    query_escaped = entry["query"].replace('"', '\\"')

    markdown = f"""---
date: {entry["date"]}
source: google-ai-mode
topic: []
tags: []
related: []
query: "{query_escaped}"
---

# {title}

## 質問（プロンプト）
{entry["prompt"]}

## AI の回答
{entry["answer"]}
{followup_section}
## 補足・考察

"""

    return markdown


def convert_html_to_markdown(input_file: str, output_dir: str, dry_run: bool = False):
    """メイン変換処理。"""
    print(f"📂 入力ファイル: {input_file}")
    print(f"📁 出力ディレクトリ: {output_dir}")
    print()

    # エントリ抽出
    entries = extract_entries(input_file)
    print(f"✅ {len(entries)} 件のエントリを抽出しました。")

    if not entries:
        print("⚠️ エントリが見つかりませんでした。")
        return

    # 出力ディレクトリ作成
    if not dry_run:
        os.makedirs(output_dir, exist_ok=True)

    # slug の衝突を避けるためのカウンター
    slug_counts: dict[str, int] = {}

    success_count = 0
    error_count = 0

    for i, entry in enumerate(entries):
        base_slug = generate_slug(entry["query"])

        # 同一 slug の衝突回避
        if base_slug in slug_counts:
            slug_counts[base_slug] += 1
            slug = f"{base_slug}-{slug_counts[base_slug]}"
        else:
            slug_counts[base_slug] = 0
            slug = base_slug

        filename = f"{entry['file_date']}_{slug}.md"
        filepath = os.path.join(output_dir, filename)

        markdown = build_markdown(entry, slug, i)

        if dry_run:
            print(f"  [DRY RUN] {filename}")
            success_count += 1
        else:
            try:
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(markdown)
                success_count += 1
            except Exception as e:
                print(f"  ❌ エラー: {filename} - {e}")
                error_count += 1

        # 進捗表示（100件ごと）
        if (i + 1) % 100 == 0:
            print(f"  ... {i + 1}/{len(entries)} 件処理済み")

    print()
    print(f"🎉 変換完了: {success_count} 件成功, {error_count} 件失敗")
    print(f"📁 出力先: {output_dir}")

    # 月別集計
    month_counts: dict[str, int] = {}
    for entry in entries:
        month = entry["file_date"][:7]  # YYYY-MM
        month_counts[month] = month_counts.get(month, 0) + 1

    print()
    print("📊 月別エントリ数:")
    for month in sorted(month_counts.keys()):
        bar = "█" * (month_counts[month] // 5)
        print(f"  {month}: {month_counts[month]:3d} 件 {bar}")


def main():
    parser = argparse.ArgumentParser(
        description="Google AI Mode の My Activity HTML を Markdown に変換"
    )
    parser.add_argument(
        "--output-dir",
        default=DEFAULT_OUTPUT_DIR,
        help=f"出力ディレクトリ (デフォルト: {DEFAULT_OUTPUT_DIR})",
    )
    parser.add_argument(
        "--input-file",
        default=INPUT_FILE,
        help=f"入力 HTML ファイル (デフォルト: {INPUT_FILE})",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="実際にファイルを書き込まずにプレビューする",
    )
    args = parser.parse_args()

    convert_html_to_markdown(args.input_file, args.output_dir, args.dry_run)


if __name__ == "__main__":
    main()
