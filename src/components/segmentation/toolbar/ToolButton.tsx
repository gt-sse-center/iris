import React from 'react';

interface ToolButtonProps {
  id?: string;
  icon: string;
  onClick: () => void;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
  testId?: string;
  children?: React.ReactNode;
  checked?: boolean;
  disabled?: boolean;
  label?: string;
}

const ToolButton: React.FC<ToolButtonProps> = ({
  id,
  icon,
  onClick,
  title,
  className = '',
  style,
  testId,
  children,
  checked = false,
  disabled = false,
  label
}) => {
  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    onClick();
  };

  const buttonClassName = `toolbutton icon_button ${className} ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}`.trim();

  return (
    <li
      id={id}
      className={buttonClassName}
      onClick={handleClick}
      title={title}
      style={{
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        justifyContent: label ? 'flex-start' : 'center',
        padding: label ? '6px 10px' : '6px',
        minHeight: '32px',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        margin: '0',
        ...style,
      }}
      data-testid={testId}
    >
      <img 
        src={icon} 
        className="icon" 
        alt="" 
        style={{ 
          flexShrink: 0, 
          width: '18px', 
          height: '18px',
          filter: checked ? 'brightness(0) invert(1)' : 'none',
        }} 
      />
      {label && (
        <span style={{ 
          color: checked ? 'white' : '#2c3e50', 
          fontSize: '13px', 
          fontWeight: checked ? '600' : 'normal',
          whiteSpace: 'nowrap',
          flex: 1,
        }}>
          {label}
        </span>
      )}
      {children}
    </li>
  );
};

export default ToolButton;
