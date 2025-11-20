import React from 'react';

interface FormInputProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: 'text' | 'number';
  required?: boolean;
  description?: string;
  codeExample?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  description,
  codeExample,
}) => (
  <div style={{ marginBottom: '20px' }}>
    <label style={{ display: 'block', marginBottom: '4px' }}>
      <strong>
        {label}
        {required && ' *'}
      </strong>
    </label>
    {description && (
      <small style={{ display: 'block', color: '#666', marginBottom: '8px', lineHeight: '1.5' }}>
        {description}
      </small>
    )}
    {codeExample && (
      <pre
        style={{
          background: '#f5f5f5',
          padding: '8px',
          borderRadius: '4px',
          fontSize: '12px',
          marginBottom: '8px',
        }}
      >
        {codeExample}
      </pre>
    )}
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
    />
  </div>
);

interface FormSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  description?: string;
}

export const FormSlider: React.FC<FormSliderProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step,
  description,
}) => (
  <div style={{ marginBottom: '20px' }}>
    <label style={{ display: 'block', marginBottom: '4px' }}>
      <strong>{label}</strong>
    </label>
    {description && (
      <small style={{ display: 'block', color: '#666', marginBottom: '8px' }}>{description}</small>
    )}
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ flex: 1 }}
      />
      <span style={{ minWidth: '70px', textAlign: 'right' }}>{value}</span>
    </div>
  </div>
);

interface FormCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}

export const FormCheckbox: React.FC<FormCheckboxProps> = ({ label, checked, onChange, description }) => (
  <div style={{ marginBottom: '20px' }}>
    <label style={{ display: 'block', marginBottom: '4px' }}>
      <strong>{label}</strong>
    </label>
    {description && (
      <small style={{ display: 'block', color: '#666', marginBottom: '8px' }}>{description}</small>
    )}
    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ marginRight: '8px' }}
      />
      {label}
    </label>
  </div>
);

interface FormRadioGroupProps {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  description?: string;
}

export const FormRadioGroup: React.FC<FormRadioGroupProps> = ({
  label,
  options,
  value,
  onChange,
  description,
}) => (
  <div style={{ marginBottom: '20px' }}>
    <label style={{ display: 'block', marginBottom: '4px' }}>
      <strong>{label}</strong>
    </label>
    {description && (
      <small style={{ display: 'block', color: '#666', marginBottom: '8px' }}>{description}</small>
    )}
    {options.map((option) => (
      <label key={option} style={{ display: 'block', marginBottom: '4px', cursor: 'pointer' }}>
        <input
          type="radio"
          name={label}
          value={option}
          checked={value === option}
          onChange={(e) => onChange(e.target.value)}
          style={{ marginRight: '8px' }}
        />
        {option}
      </label>
    ))}
  </div>
);

interface FormSelectProps {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  description?: string;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  label,
  options,
  value,
  onChange,
  required = false,
  description,
}) => (
  <div style={{ marginBottom: '20px' }}>
    <label style={{ display: 'block', marginBottom: '4px' }}>
      <strong>
        {label}
        {required && ' *'}
      </strong>
    </label>
    {description && (
      <small style={{ display: 'block', color: '#666', marginBottom: '8px' }}>{description}</small>
    )}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </div>
);
