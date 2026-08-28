import { Calendar, ArrowUp, ArrowDown } from 'lucide-react';
import HelpIcon from './HelpIcon';

const ScheduleSection = ({ node, reorderNode, updateNode, t }) => {
  const handlePhaseChange = (e) => {
    updateNode(node.id, { phase: e.target.value });
  };

  const handleDueDateChange = (e) => {
    updateNode(node.id, { dueDate: e.target.value });
  };

  return (
    <section className="inspector-section">
      <h3 className="section-title">
        <Calendar size={14} /> {t('inspector.schedule')}
      </h3>
      <div className="schedule-controls">
        <div className="control-group">
          <label>{t('inspector.phase')}</label>
          <select
            value={node.phase || 'PREP'}
            onChange={handlePhaseChange}
            className="phase-select"
          >
            <option value="PREP">{t('phases.PREP')}</option>
            <option value="EXEC">{t('phases.EXEC')}</option>
            <option value="REVIEW">{t('phases.REVIEW')}</option>
          </select>
        </div>
        <div className="control-group">
          <label>{t('inspector.due_date')}</label>
          <input
            type="date"
            value={node.dueDate || ''}
            onChange={handleDueDateChange}
            className="date-input"
          />
        </div>
      </div>

      <div className="order-controls">
        <div className="section-subtitle-row">
          <label className="section-subtitle">{t('inspector.order_section')}</label>
          <HelpIcon text={t('inspector.order_section_help')} />
        </div>
        <div className="order-buttons">
          <button
            className="order-btn"
            onClick={() => reorderNode(node.id, 'up')}
            title={t('inspector.move_up')}
          >
            <ArrowUp size={14} /> {t('inspector.move_up')}
          </button>
          <button
            className="order-btn"
            onClick={() => reorderNode(node.id, 'down')}
            title={t('inspector.move_down')}
          >
            <ArrowDown size={14} /> {t('inspector.move_down')}
          </button>
        </div>
      </div>
    </section>
  );
};

export default ScheduleSection;
