import { useState } from 'react';
import { Link, X, Plus } from 'lucide-react';

const DependencySection = ({
  node,
  predecessors,
  nodes,
  onSelectNode,
  addDependency,
  removeDependency,
  t
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const searchResults = searchQuery.trim()
    ? Object.values(nodes).filter(n =>
        n.id !== node.id &&
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(node.dependsOn || []).includes(n.id)
      ).slice(0, 5)
    : [];

  return (
    <section className="inspector-section">
      <h3 className="section-title">
        <Link size={14} /> {t('inspector.predecessors')}
      </h3>
      <div className="dependency-manager">
        <div className="current-dependencies">
          {predecessors.length === 0 ? (
            <p className="empty-text">{t('inspector.no_predecessors')}</p>
          ) : (
            predecessors.map(p => (
              <div key={p.id} className="dependency-tag">
                <span onClick={() => onSelectNode(p.id)}>{p.title}</span>
                <button onClick={() => removeDependency(node.id, p.id)}>
                  <X size={12} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="dependency-search">
          <input
            type="text"
            placeholder={t('inspector.search_to_link')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map(r => (
                <div
                  key={r.id}
                  className="search-result-item"
                  onClick={() => {
                    addDependency(node.id, r.id);
                    setSearchQuery('');
                  }}
                >
                  <span>{r.title}</span>
                  <Plus size={12} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default DependencySection;
