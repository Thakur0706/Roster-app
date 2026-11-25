import React, { useState, useRef, useEffect, useMemo } from 'react';

/**
 * Custom modern dropdown replacing native <select>.
 * Supports both:
 * 1. options prop: [{ value, label }] or [string]
 * 2. children: <option value="...">Label</option>
 */
export default function CustomSelect({
  value,
  onChange,
  options: optionsProp,
  children,
  placeholder = 'Select…',
  className = '',
  style = {},
  disabled = false,
  name,
  id,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Normalize options from optionsProp or React children
  const options = useMemo(() => {
    if (optionsProp && Array.isArray(optionsProp)) {
      return optionsProp.map((opt) => {
        if (typeof opt === 'object' && opt !== null) {
          return {
            value: opt.value !== undefined ? opt.value : opt.id,
            label: opt.label !== undefined ? opt.label : opt.name || String(opt.value),
          };
        }
        return { value: opt, label: String(opt) };
      });
    }

    if (children) {
      const parsed = [];
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child) && child.type === 'option') {
          parsed.push({
            value: child.props.value !== undefined ? child.props.value : child.props.children,
            label: child.props.children,
          });
        }
      });
      return parsed;
    }

    return [];
  }, [optionsProp, children]);

  // Find currently selected label
  const selectedOption = options.find((opt) => String(opt.value) === String(value));
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation (Escape to close)
  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    }
  };

  const handleSelect = (optValue) => {
    setIsOpen(false);
    if (onChange) {
      const syntheticEvent = {
        target: { value: optValue, name, id },
        currentTarget: { value: optValue, name, id },
        preventDefault: () => {},
        stopPropagation: () => {},
      };
      syntheticEvent.value = optValue;
      onChange(syntheticEvent, optValue);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`custom-select-wrap ${disabled ? 'disabled' : ''} ${isOpen ? 'open' : ''}`}
      style={style}
    >
      <button
        type="button"
        id={id}
        name={name}
        className={`custom-select-trigger ${className}`}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={`custom-select-value ${!selectedOption ? 'placeholder' : ''}`}>
          {displayLabel}
        </span>
        <svg
          className={`custom-select-arrow ${isOpen ? 'rotated' : ''}`}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className="custom-select-dropdown" role="listbox">
          {options.length === 0 ? (
            <div className="custom-select-empty">No options</div>
          ) : (
            options.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <div
                  key={String(opt.value)}
                  className={`custom-select-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelect(opt.value)}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span className="custom-select-item-label">{opt.label}</span>
                  {isSelected && (
                    <svg
                      className="custom-select-check"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
