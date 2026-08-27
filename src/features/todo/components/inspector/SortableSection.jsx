import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

const SortableSection = ({ id, isReorderMode, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`sortable-section${isDragging ? ' is-dragging' : ''}`}
    >
      {isReorderMode && (
        <div className="drag-handle" {...attributes} {...listeners}>
          <GripVertical size={16} />
        </div>
      )}
      {children}
    </div>
  );
};

export default SortableSection;
