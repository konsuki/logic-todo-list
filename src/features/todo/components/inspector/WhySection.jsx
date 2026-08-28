import { useState } from 'react';
import { ChevronUp, ChevronDown, Target, ExternalLink } from 'lucide-react';

const WhySection = ({ node, pathToRoot, onSelectNode, t }) => {
  const [isWhyOpen, setIsWhyOpen] = useState(true);

  return (
    <section className="inspector-section">
      <h3 className="section-title section-title--clickable" onClick={() => setIsWhyOpen(v => !v)}>
        {isWhyOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {t('inspector.why')}
      </h3>
      {isWhyOpen && (
        <>
          <div className="why-path">
            {pathToRoot.length === 0 ? (
              <div className="path-item root">
                <Target size={14} />
                <span>{t('inspector.root_goal')}</span>
              </div>
            ) : (
              pathToRoot.map((n) => (
                <div
                  key={n.id}
                  className="path-item linkable"
                  onClick={() => onSelectNode(n.id)}
                >
                  <div className="path-dot" />
                  <span className="path-title">{n.title}</span>
                  <ExternalLink size={12} className="link-icon" />
                </div>
              ))
            )}
            <div className="path-item active">
              <div className="path-dot active" />
              <span className="path-title current">{node.title}</span>
            </div>
          </div>
          <p className="logic-guide">
            {pathToRoot.length > 0
              ? t('inspector.achieve_context', { parent: pathToRoot[pathToRoot.length - 1].title })
              : t('inspector.focus_objective')}
          </p>
        </>
      )}
    </section>
  );
};

export default WhySection;
