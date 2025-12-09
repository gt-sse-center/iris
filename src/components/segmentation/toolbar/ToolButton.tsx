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
  disabled = false
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
        ...style,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer'
      }}
      data-testid={testId}
    >
      <img src={icon} className="icon" alt="" />
      {children}
    </li>
  );
};

export default ToolButton;
