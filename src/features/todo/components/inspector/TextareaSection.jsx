import InspectorTextarea from './InspectorTextarea';

const FIELD_CONFIG = {
  description: {
    label: 'inspector.description',
    placeholder: 'inspector.placeholder_desc',
  },
  intent: {
    label: 'inspector.intent',
    placeholder: 'inspector.placeholder_intent',
  },
  procedure: {
    label: 'inspector.procedure',
    placeholder: 'inspector.placeholder_procedure',
    helpText: 'inspector.procedure_help',
  },
};

const TextareaSection = ({ nodeId, node, field, updateNode, t }) => {
  const config = FIELD_CONFIG[field];

  return (
    <InspectorTextarea
      key={nodeId}
      nodeId={nodeId}
      value={node[field] || ''}
      onChange={(text) => updateNode(nodeId, { [field]: text })}
      onModalChange={(text) => updateNode(nodeId, { [field]: text })}
      label={t(config.label)}
      placeholder={t(config.placeholder)}
      helpText={config.helpText ? t(config.helpText) : undefined}
      t={t}
    />
  );
};

export default TextareaSection;
