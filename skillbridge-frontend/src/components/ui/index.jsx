import { createElement, forwardRef } from 'react';

const classes = (...parts) => parts.filter(Boolean).join(' ');

const buttonVariants = {
  primary: 'ui-button-primary',
  secondary: 'ui-button-secondary',
  ghost: 'ui-button-ghost',
  danger: 'ui-button-danger',
};

const buttonSizes = {
  sm: 'ui-button-sm',
  md: '',
  lg: 'ui-button-lg',
};

export const Button = forwardRef(
  (
    {
      as: Component = 'button',
      variant = 'primary',
      size = 'md',
      className = '',
      type,
      ...props
    },
    ref,
  ) => {
    const resolvedType = Component === 'button' ? type || 'button' : type;
    const componentProps = {
      ref,
      className: classes(
        'ui-button',
        buttonVariants[variant] || buttonVariants.primary,
        buttonSizes[size] || '',
        className,
      ),
      ...(resolvedType ? { type: resolvedType } : {}),
      ...props,
    };

    return createElement(Component, componentProps);
  },
);

Button.displayName = 'Button';

export const PrimaryButton = forwardRef((props, ref) => (
  <Button ref={ref} variant="primary" {...props} />
));

PrimaryButton.displayName = 'PrimaryButton';

export const SecondaryButton = forwardRef((props, ref) => (
  <Button ref={ref} variant="secondary" {...props} />
));

SecondaryButton.displayName = 'SecondaryButton';

export const TextInput = forwardRef(({ className = '', ...props }, ref) => (
  <input ref={ref} className={classes('ui-input', className)} {...props} />
));

TextInput.displayName = 'TextInput';

export const SelectInput = forwardRef(({ className = '', children, ...props }, ref) => (
  <select ref={ref} className={classes('ui-select', className)} {...props}>
    {children}
  </select>
));

SelectInput.displayName = 'SelectInput';

export const Textarea = forwardRef(({ className = '', ...props }, ref) => (
  <textarea ref={ref} className={classes('ui-textarea', className)} {...props} />
));

Textarea.displayName = 'Textarea';

export const FormField = ({
  label,
  helpText,
  error,
  children,
  className = '',
}) => (
  <div className={classes('ui-field', className)}>
    {label && <label className="ui-label">{label}</label>}
    {children}
    {error ? (
      <p className="ui-error-text">{error}</p>
    ) : (
      helpText && <p className="ui-help-text">{helpText}</p>
    )}
  </div>
);

export const Card = ({
  as: Component = 'div',
  hover = false,
  padded = true,
  className = '',
  ...props
}) => (
  createElement(Component, {
    className: classes(
      'ui-card',
      hover && 'ui-card-hover',
      padded && 'ui-card-pad',
      className,
    ),
    ...props,
  })
);

export const SectionHeader = ({
  eyebrow,
  title,
  description,
  actions,
  className = '',
}) => (
  <div className={classes('ui-section-header', className)}>
    {eyebrow && <p className="ui-section-eyebrow">{eyebrow}</p>}
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {title && <h2 className="ui-section-title">{title}</h2>}
        {description && <p className="ui-section-description mt-3">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  </div>
);

export const StatCard = ({
  icon,
  value,
  label,
  detail,
  className = '',
}) => (
  <div className={classes('ui-stat-card', className)}>
    {icon && <span className="ui-stat-icon">{icon}</span>}
    <div className="min-w-0">
      <p className="ui-stat-value">{value}</p>
      <p className="ui-stat-label">{label}</p>
      {detail && <p className="ui-help-text mt-1">{detail}</p>}
    </div>
  </div>
);

const badgeVariants = {
  neutral: '',
  emerald: 'ui-badge-emerald',
  dark: 'ui-badge-dark',
  amber: 'ui-badge-amber',
  red: 'ui-badge-red',
  blue: 'ui-badge-blue',
};

export const Badge = ({
  variant = 'neutral',
  className = '',
  ...props
}) => (
  <span
    className={classes('ui-badge', badgeVariants[variant] || '', className)}
    {...props}
  />
);

export const EmptyState = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => (
  <div className={classes('ui-empty-state', className)}>
    {icon && <span className="ui-empty-icon">{icon}</span>}
    {title && <p className="ui-empty-title">{title}</p>}
    {description && <p className="ui-empty-description">{description}</p>}
    {action && <div className="mt-2">{action}</div>}
  </div>
);

export const LoadingIndicator = ({
  label = 'Loading',
  className = '',
}) => (
  <span className={classes('ui-loading', className)} role="status" aria-live="polite">
    <span className="ui-spinner" aria-hidden="true" />
    <span>{label}</span>
  </span>
);
