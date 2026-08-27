import { useState, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Folder } from 'lucide-react';
import * as treeLogic from '../../../../logic/treeLogic';
import './SearchBar.css';

/**
 * SearchBar: アイコントグル型の検索UI。
 * グローバルヘッダーの Settings ボタンの左に検索アイコンだけを表示し、
 * クリックで検索パネル（input ＋ 候補一覧）をオーバーレイ展開する。
 *
 * - 開閉: アイコンクリック（トグル）/ Esc / 候補選択後 / フィールド外クリック(blur)
 * - 検索: タイトル部分一致（大文字小文字無視）。スコープは displayMode に依存。
 * - ジャンプ: treeRef (react-arborist の TreeApi) の openParents → scrollTo → onSelectNode
 */
const SearchBar = ({ nodes, displayMode, treeRef, onSelectNode, t }) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef(null);
  const buttonRef = useRef(null);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return treeLogic.searchNodes(nodes, searchQuery, { mode: displayMode });
  }, [nodes, searchQuery, displayMode]);

  const close = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery('');
    // 閉じた後、フォーカスをアイコンへ戻す（キーボード操作の連続性）
    buttonRef.current?.focus();
  }, []);

  const handleToggle = () => {
    if (searchOpen) {
      close();
    } else {
      setSearchOpen(true);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      close();
    }
  };

  const handleSelect = (nodeId) => {
    treeRef.current?.openParents(nodeId);
    treeRef.current?.scrollTo(nodeId, 'center');
    onSelectNode(nodeId);
    close();
  };

  return (
    <div className="search-bar">
      <button
        ref={buttonRef}
        className={`icon-btn search-toggle-btn ${searchOpen ? 'active' : ''}`}
        onClick={handleToggle}
        title="Search"
        aria-expanded={searchOpen}
        aria-controls="search-panel"
      >
        <Search size={20} color={searchOpen ? 'var(--primary-color)' : 'var(--text-muted)'} />
      </button>

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            id="search-panel"
            className="search-panel"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <div className="search-box">
              <Search size={14} className="search-icon" />
              <input
                ref={inputRef}
                type="text"
                autoFocus
                value={searchQuery}
                placeholder={t('list.search_placeholder')}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => setTimeout(() => { if (searchOpen) close(); }, 150)}
              />
            </div>

            {searchQuery.trim() && (
              <div className="search-results">
                {searchResults.length === 0 ? (
                  <div className="search-result-empty">{t('list.search_no_results')}</div>
                ) : (
                  searchResults.map((r) => (
                    <div
                      key={r.id}
                      className="search-result-item"
                      onMouseDown={(e) => { e.preventDefault(); handleSelect(r.id); }}
                    >
                      {r.type === 'FOLDER' ? (
                        <Folder size={14} className="folder-icon" />
                      ) : (
                        <span className={`node-type-tag ${r.type.toLowerCase()}`}>{r.type}</span>
                      )}
                      <span className="search-result-title">{r.title}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;
