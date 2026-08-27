import { useState, useRef, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import { Info } from 'lucide-react';
import './HelpIcon.css';

const HelpIcon = ({ text }) => {
  const [open, setOpen] = useState(false);
  const iconRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (open && iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      setPos({ top: rect.top, left: rect.left + rect.width / 2 });
    }
  }, [open]);

  return (
    <>
      <span
        ref={iconRef}
        className="help-icon"
        tabIndex={0}
        role="img"
        aria-label={text}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <Info size={13} />
      </span>
      {open &&
        ReactDOM.createPortal(
          <div className="help-tooltip" style={{ top: pos.top, left: pos.left }}>
            {text}
          </div>,
          document.body
        )}
    </>
  );
};

export default HelpIcon;
