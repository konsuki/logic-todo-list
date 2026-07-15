import React, { useState, useEffect } from 'react';
import { ExternalLink, Maximize2 } from 'lucide-react';
import DescriptionModal from './DescriptionModal';

const renderText = (text) => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[a-zA-Z0-9-._~:/?#\[\]@!$&'()*+,;%=]*[a-zA-Z0-9_~/#%?&=-])/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="description-link"
          onClick={(e) => e.stopPropagation()}
        >
          {part}<ExternalLink size={10} style={{ marginLeft: '2px', verticalAlign: 'middle' }} />
        </a>
      );
    }
    return part;
  });
};

const InspectorTextarea = ({ nodeId, value, onChange, onModalChange, label, placeholder, t }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setIsEditing(false);
    setIsModalOpen(false);
  }, [nodeId]);

  return (
    <section className="inspector-section">
      <div className="section-header-with-action">
        <h3 className="section-title">{label}</h3>
        <div className="description-header-actions">
          {!isEditing && value && (
            <button className="edit-subtle-btn" onClick={() => setIsEditing(true)}>
              {t('common.edit') || 'Edit'}
            </button>
          )}
          <button
            className="expand-btn"
            onClick={() => setIsModalOpen(true)}
            title={t('inspector.expand_description') || 'Expand editor'}
          >
            <Maximize2 size={13} />
          </button>
        </div>
      </div>

      {isEditing || !value ? (
        <textarea
          key={nodeId}
          autoFocus={isEditing}
          className="description-area"
          placeholder={placeholder}
          defaultValue={value || ''}
          onBlur={(e) => {
            onChange(e.target.value);
            setIsEditing(false);
          }}
        />
      ) : (
        <div
          className="description-display"
          onClick={() => setIsEditing(true)}
          title="Click to edit"
        >
          {renderText(value)}
        </div>
      )}

      <DescriptionModal
        isOpen={isModalOpen}
        value={value || ''}
        onChange={onModalChange}
        onClose={() => setIsModalOpen(false)}
        t={t}
      />
    </section>
  );
};

export default InspectorTextarea;
