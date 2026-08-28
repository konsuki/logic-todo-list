import { Folder, FolderPlus } from 'lucide-react';

const FolderSection = ({ node, folders, useFolderView, assignTaskToFolder, addFolder, t }) => {
  if (node.type === 'FOLDER' || useFolderView === false) return null;

  return (
    <section className="inspector-section">
      <h3 className="section-title">
        <Folder size={14} /> {t('inspector.folder')}
      </h3>
      <div className="folder-assign-controls">
        <select
          className="folder-select"
          value={node.folderId || ''}
          onChange={(e) => assignTaskToFolder(node.id, e.target.value || null)}
        >
          <option value="">{t('inspector.no_folder')}</option>
          {(folders || []).map(f => (
            <option key={f.id} value={f.id}>{f.title}</option>
          ))}
        </select>
        <button
          className="add-folder-btn"
          onClick={() => {
            const title = prompt(t('list.enter_folder'));
            if (title) {
              addFolder(null, title);
            }
          }}
          title={t('list.new_folder')}
        >
          <FolderPlus size={14} />
        </button>
      </div>
    </section>
  );
};

export default FolderSection;
